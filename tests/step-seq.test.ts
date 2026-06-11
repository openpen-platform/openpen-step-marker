import { describe, expect, it } from 'vitest'
import type { Stroke } from '@openpen/module-api'
import {
  countStepMarkers,
  deriveSeq,
  STEP_MARKER_TOOL_ID,
} from '../src/step-seq'

const baseStyle: Stroke['style'] = {
  color: '#000000',
  lineWidth: 2,
  lineCap: 'round',
  lineJoin: 'round',
}

function strokeOf(tool: string): Stroke {
  return {
    id: crypto.randomUUID(),
    tool,
    points: [{ x: 0, y: 0 }],
    style: baseStyle,
  }
}

function stepMarker(): Stroke {
  return strokeOf(STEP_MARKER_TOOL_ID)
}

describe('countStepMarkers', () => {
  it('returns 0 for an empty canvas', () => {
    expect(countStepMarkers([])).toBe(0)
  })

  it('counts only strokes whose tool === step-marker', () => {
    const strokes = [
      strokeOf('line'),
      stepMarker(),
      strokeOf('freehand'),
      stepMarker(),
      strokeOf('rectangle'),
    ]
    expect(countStepMarkers(strokes)).toBe(2)
  })
})

describe('deriveSeq', () => {
  it('starts at 1 on an empty canvas', () => {
    expect(deriveSeq([])).toBe(1)
  })

  it('is existing-marker-count plus one', () => {
    expect(deriveSeq([stepMarker(), stepMarker(), stepMarker()])).toBe(4)
  })

  it('counts only step-marker strokes when other tools are interleaved', () => {
    const strokes = [
      strokeOf('line'),
      stepMarker(),
      strokeOf('freehand'),
      stepMarker(),
    ]
    expect(deriveSeq(strokes)).toBe(3)
  })

  // The core design invariant: numbering is count-derived, so it stays in sync
  // with the host's LIFO undo without a private counter. A standalone counter
  // would skip numbers after an undo; this sequence proves it does not.
  it('does not skip or repeat numbers across an undo / re-place cycle', () => {
    const canvas: Stroke[] = []

    // Place three markers, asserting each derived seq before committing.
    expect(deriveSeq(canvas)).toBe(1)
    canvas.push(stepMarker())
    expect(deriveSeq(canvas)).toBe(2)
    canvas.push(stepMarker())
    expect(deriveSeq(canvas)).toBe(3)
    canvas.push(stepMarker())
    expect(canvas.length).toBe(3)

    // Undo the last marker (host LIFO removes the tail).
    canvas.pop()
    expect(canvas.length).toBe(2)

    // Next number rolls back to 3 — no skip to 4, no repeat of 2.
    expect(deriveSeq(canvas)).toBe(3)

    // Re-placing reuses 3, and the count climbs cleanly afterwards.
    canvas.push(stepMarker())
    expect(deriveSeq(canvas)).toBe(4)
  })

  it('ignores non-marker strokes added after an undo when re-deriving', () => {
    const canvas: Stroke[] = [stepMarker(), stepMarker()]
    canvas.pop() // undo the second marker -> count back to 1
    canvas.push(strokeOf('line')) // unrelated stroke from another tool
    // Next marker number derives from the single remaining marker, not the line.
    expect(deriveSeq(canvas)).toBe(2)
  })
})
