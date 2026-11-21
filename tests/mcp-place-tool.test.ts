import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Stroke, StrokeStyle } from '@openpen/module-api'
import { callMcpTool } from '@openpen/module-api/testing'

const PEN_COLOR = '#123456'
const PEN_WIDTH = 6
const strokesState: Stroke[] = []
const commitStroke = vi.fn((stroke: Stroke) => {
  strokesState.push(stroke)
})

vi.mock('@openpen/module-api/host', () => ({
  commitStroke: (stroke: Stroke) => commitStroke(stroke),
  getAllStrokes: () => strokesState,
  emit: vi.fn(),
  on: vi.fn(() => () => {}),
  useStrokeStyle: () => ({ color: { value: PEN_COLOR }, lineWidth: { value: PEN_WIDTH } }),
}))

const { default: stepMarkerModule } = await import('../src/index')

const placeTool = () => {
  const tool = stepMarkerModule.contributes.mcpTools?.find((t) => t.name === 'place')
  if (!tool) throw new Error('step-marker module contributes no place MCP tool')
  return tool
}

/** Screenshot pixels → canvas points on a 2x display with a 50 px menu bar. */
const toCanvas = (p: { x: number; y: number }) => ({ x: p.x / 2, y: (p.y - 50) / 2 })

beforeEach(() => {
  commitStroke.mockClear()
  strokesState.length = 0
})

describe('MCP place tool — AC #1: places the next step number at the screenshot position', () => {
  it('commits the same stroke a manual click at the converted point makes', async () => {
    const result = await callMcpTool(placeTool(), { x: 300, y: 450 }, { toCanvas })

    expect(result.isError).toBeUndefined()
    expect(commitStroke).toHaveBeenCalledTimes(1)
    const placed = commitStroke.mock.calls[0][0] as Stroke
    expect(placed.points).toEqual([{ x: 150, y: 200 }])
    expect(placed.seq).toBe(1)
    expect(result.structuredContent).toMatchObject({ id: placed.id, seq: 1 })

    // Manual click with the host's current pen style at the same canvas point,
    // on the canvas as it was before the agent's marker.
    strokesState.length = 0
    const manualTool = stepMarkerModule.contributes.tools![0]
    const hostStyle: StrokeStyle = { color: PEN_COLOR, lineWidth: PEN_WIDTH, lineCap: 'round', lineJoin: 'round' }
    const canvas = {} as CanvasRenderingContext2D
    manualTool.onPointerDown!(canvas, { x: 150, y: 200 }, hostStyle)
    const manual = manualTool.onPointerUp!(canvas, { x: 150, y: 200 }, {}) as Stroke
    expect({ ...placed, id: 'x' }).toEqual({ ...manual, id: 'x' })
  })

  it('numbers successive markers 1, 2, 3, continuing after markers already on the canvas', async () => {
    const seqs: number[] = []
    for (const x of [100, 200, 300]) {
      await callMcpTool(placeTool(), { x, y: 100 }, { toCanvas })
      seqs.push(strokesState.at(-1)!.seq as number)
    }
    expect(seqs).toEqual([1, 2, 3])
  })
})

describe('MCP place tool — AC #3: listed annotations name the step-marker plugin as the source', () => {
  it('places with the step-marker canvas tool id, which the host maps to @openpen/step-marker', async () => {
    await callMcpTool(placeTool(), { x: 10, y: 60 }, { toCanvas })

    const placed = commitStroke.mock.calls[0][0] as Stroke
    // The host lists a stroke's source as the module that contributes the
    // canvas tool whose id equals `stroke.tool`.
    const ownTool = stepMarkerModule.contributes.tools!.find((t) => t.id === placed.tool)
    expect(ownTool).toBeDefined()
    expect(stepMarkerModule.id).toBe('@openpen/step-marker')
  })
})
