import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stroke, StrokeStyle } from '@openpen/module-api'

// getAllStrokes reaches into the host registry, which is not booted in tests.
// Mock the host sub-path so the tool reads a canvas state we fully control.
const strokesState: Stroke[] = []
vi.mock('@openpen/module-api/host', () => ({
  getAllStrokes: () => strokesState,
}))

import {
  createStepMarkerTool,
  renderStepMarkerStroke,
  type StepMarkerStyle,
} from '../src/step-marker-tool'
import { STEP_MARKER_TOOL_ID } from '../src/step-seq'

const style: StrokeStyle = {
  color: '#123456',
  lineWidth: 4,
  lineCap: 'round',
  lineJoin: 'round',
}

function markerStroke(): Stroke {
  return {
    id: crypto.randomUUID(),
    tool: STEP_MARKER_TOOL_ID,
    points: [{ x: 0, y: 0 }],
    style,
  }
}

/** Minimal spy-backed CanvasRenderingContext2D for renderer assertions. */
function mockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '' as string,
    font: '' as string,
    textAlign: '' as CanvasTextAlign,
    textBaseline: '' as CanvasTextBaseline,
  }
}

beforeEach(() => {
  strokesState.length = 0
})

describe('createStepMarkerTool — onPointerUp', () => {
  it('commits a step-marker stroke carrying the live style and derived seq', () => {
    const marker: StepMarkerStyle = {
      size: 40,
      fillColor: '#aa0000',
      textColor: '#eeeeee',
    }
    const tool = createStepMarkerTool({ style: () => marker })

    const ctx = mockCtx() as unknown as CanvasRenderingContext2D
    tool.onPointerDown(ctx, { x: 50, y: 70 }, style)
    const stroke = tool.onPointerUp(ctx, { x: 50, y: 70 })

    expect(stroke).not.toBeNull()
    expect(stroke!.tool).toBe('step-marker')
    expect(stroke!.points).toEqual([{ x: 50, y: 70 }])
    expect(stroke!.style).toEqual(style)
    expect(stroke!.seq).toBe(1) // empty canvas
    expect(stroke!.size).toBe(40)
    expect(stroke!.fillColor).toBe('#aa0000')
    expect(stroke!.textColor).toBe('#eeeeee')
  })

  it('drops the marker on the press point, ignoring a micro-drag to the release point', () => {
    const tool = createStepMarkerTool({
      style: () => ({ size: 32, fillColor: '#fff', textColor: '#000' }),
    })
    const ctx = mockCtx() as unknown as CanvasRenderingContext2D
    // Press at (50, 70); a tiny drag releases at (53, 71). The marker must land
    // on the press point, not the release point.
    tool.onPointerDown(ctx, { x: 50, y: 70 }, style)
    const stroke = tool.onPointerUp(ctx, { x: 53, y: 71 })
    expect(stroke!.points).toEqual([{ x: 50, y: 70 }])
  })

  it('returns null when pointer-up has no preceding pointer-down', () => {
    const tool = createStepMarkerTool({
      style: () => ({ size: 32, fillColor: '#fff', textColor: '#000' }),
    })
    const ctx = mockCtx() as unknown as CanvasRenderingContext2D
    expect(tool.onPointerUp(ctx, { x: 1, y: 1 })).toBeNull()
  })

  it('snapshots the press point so later point mutation does not leak in', () => {
    const tool = createStepMarkerTool({
      style: () => ({ size: 32, fillColor: '#fff', textColor: '#000' }),
    })
    const ctx = mockCtx() as unknown as CanvasRenderingContext2D
    const point = { x: 10, y: 20 }
    tool.onPointerDown(ctx, point, style)
    point.x = 999
    const stroke = tool.onPointerUp(ctx, { x: 10, y: 20 })
    expect(stroke!.points).toEqual([{ x: 10, y: 20 }])
  })

  it('does not reuse a stale press point after a commit', () => {
    const tool = createStepMarkerTool({
      style: () => ({ size: 32, fillColor: '#fff', textColor: '#000' }),
    })
    const ctx = mockCtx() as unknown as CanvasRenderingContext2D
    tool.onPointerDown(ctx, { x: 1, y: 2 }, style)
    tool.onPointerUp(ctx, { x: 1, y: 2 })
    // A bare pointer-up with no fresh pointer-down must discard.
    expect(tool.onPointerUp(ctx, { x: 9, y: 9 })).toBeNull()
  })

  it('increments seq 1 -> 2 -> 3 as committed markers accumulate on the canvas', () => {
    const tool = createStepMarkerTool({
      style: () => ({ size: 32, fillColor: '#fff', textColor: '#000' }),
    })
    const ctx = mockCtx() as unknown as CanvasRenderingContext2D

    const seqs: number[] = []
    for (let i = 0; i < 3; i++) {
      tool.onPointerDown(ctx, { x: i, y: i }, style)
      const stroke = tool.onPointerUp(ctx, { x: i, y: i })
      seqs.push(stroke!.seq as number)
      strokesState.push(stroke!) // host commits it; next derive sees it
    }
    expect(seqs).toEqual([1, 2, 3])
  })

  it('derives seq from the live marker count, ignoring other-tool strokes', () => {
    strokesState.push(
      { ...markerStroke(), tool: 'line' },
      markerStroke(),
      { ...markerStroke(), tool: 'freehand' },
    )
    const tool = createStepMarkerTool({
      style: () => ({ size: 32, fillColor: '#fff', textColor: '#000' }),
    })
    const ctx = mockCtx() as unknown as CanvasRenderingContext2D
    tool.onPointerDown(ctx, { x: 0, y: 0 }, style)
    const stroke = tool.onPointerUp(ctx, { x: 0, y: 0 })
    expect(stroke!.seq).toBe(2) // one existing marker -> next is 2
  })
})

describe('renderStepMarkerStroke', () => {
  it('draws a disc of radius size/2 centered on the point and fills with fillColor', () => {
    const ctx = mockCtx()
    const stroke: Stroke = {
      ...markerStroke(),
      points: [{ x: 100, y: 120 }],
      seq: 5,
      size: 48,
      fillColor: '#abcdef',
      textColor: '#012345',
    }
    renderStepMarkerStroke(ctx as unknown as CanvasRenderingContext2D, stroke)

    expect(ctx.arc).toHaveBeenCalledWith(100, 120, 24, 0, 2 * Math.PI)
    expect(ctx.fill).toHaveBeenCalledTimes(1)
  })

  it('renders the seq text centered on the point in textColor', () => {
    const ctx = mockCtx()
    const stroke: Stroke = {
      ...markerStroke(),
      points: [{ x: 100, y: 120 }],
      seq: 7,
      size: 32,
      fillColor: '#aabbcc',
      textColor: '#ddeeff',
    }
    renderStepMarkerStroke(ctx as unknown as CanvasRenderingContext2D, stroke)

    expect(ctx.fillText).toHaveBeenCalledWith('7', 100, 120)
    expect(ctx.textAlign).toBe('center')
    expect(ctx.textBaseline).toBe('middle')
    // fillStyle is set twice (disc then text); last write wins = text color.
    expect(ctx.fillStyle).toBe('#ddeeff')
  })

  it('reads seq / size / fillColor / textColor back from the stroke', () => {
    const ctx = mockCtx()
    const stroke: Stroke = {
      ...markerStroke(),
      points: [{ x: 0, y: 0 }],
      seq: 12,
      size: 60,
      fillColor: '#111111',
      textColor: '#222222',
    }
    renderStepMarkerStroke(ctx as unknown as CanvasRenderingContext2D, stroke)
    expect(ctx.arc).toHaveBeenCalledWith(0, 0, 30, 0, 2 * Math.PI)
    expect(ctx.fillText).toHaveBeenCalledWith('12', 0, 0)
  })

  it('falls back to defaults when extra-state fields are missing', () => {
    const ctx = mockCtx()
    const stroke: Stroke = {
      id: 'x',
      tool: STEP_MARKER_TOOL_ID,
      points: [{ x: 5, y: 5 }],
      style,
    }
    renderStepMarkerStroke(ctx as unknown as CanvasRenderingContext2D, stroke)
    // default size 32 -> radius 16, default seq 1, default text color #ffffff.
    expect(ctx.arc).toHaveBeenCalledWith(5, 5, 16, 0, 2 * Math.PI)
    expect(ctx.fillText).toHaveBeenCalledWith('1', 5, 5)
    expect(ctx.fillStyle).toBe('#ffffff')
  })

  it('does nothing when the stroke has no point', () => {
    const ctx = mockCtx()
    const stroke: Stroke = {
      id: 'x',
      tool: STEP_MARKER_TOOL_ID,
      points: [],
      style,
    }
    renderStepMarkerStroke(ctx as unknown as CanvasRenderingContext2D, stroke)
    expect(ctx.arc).not.toHaveBeenCalled()
    expect(ctx.fillText).not.toHaveBeenCalled()
  })
})
