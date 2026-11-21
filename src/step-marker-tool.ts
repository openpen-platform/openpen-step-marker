/**
 * Step-marker tool — each click commits one sequentially numbered circular
 * marker. The number is derived from the live canvas marker count at commit
 * time (see step-seq.ts), so it tracks host undo / redo without a private
 * counter. The committed Stroke carries `seq`, `size`, `fillColor`, and
 * `textColor` as extra state so `renderStepMarkerStroke` can repaint identical
 * markers on history replay (the host fallback polyline cannot draw a numbered
 * disc, so a custom renderer is mandatory).
 */
import { getAllStrokes } from '@openpen/module-api/host'
import type { Point, Stroke, StrokeStyle, Tool } from '@openpen/module-api'
import { deriveSeq, STEP_MARKER_TOOL_ID } from './step-seq'

export interface StepMarkerStyle {
  size: number
  fillColor: string
  textColor: string
}

export interface StepMarkerToolOptions {
  /** Returns the current marker appearance at commit time. */
  style: () => StepMarkerStyle
}

/** Paint one numbered disc centered on `center`. */
function paintMarker(
  ctx: CanvasRenderingContext2D,
  center: Point,
  seq: number,
  style: StepMarkerStyle,
): void {
  const radius = style.size / 2
  ctx.save()

  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = style.fillColor
  ctx.fill()

  const fontSize = Math.round(style.size * 0.56)
  ctx.fillStyle = style.textColor
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(seq), center.x, center.y)

  ctx.restore()
}

/**
 * The finished marker Stroke centred on `center`, numbered from the live
 * canvas marker count. Shared by the pointer tool and the MCP place tool so a
 * marker an agent places is the same stroke a manual click makes.
 */
export function buildStepMarkerStroke(
  center: Point,
  style: StrokeStyle,
  marker: StepMarkerStyle,
): Stroke {
  return {
    id: crypto.randomUUID(),
    tool: STEP_MARKER_TOOL_ID,
    points: [{ ...center }],
    style: { ...style },
    seq: deriveSeq(getAllStrokes()),
    size: marker.size,
    fillColor: marker.fillColor,
    textColor: marker.textColor,
  }
}

export function createStepMarkerTool(opts: StepMarkerToolOptions): Tool {
  let lastStyle: StrokeStyle | null = null
  // A marker drops on the press point, not the release point: committing from
  // the pointer-up coordinate would shift the disc by any micro-drag between
  // press and release.
  let downPoint: Point | null = null

  return {
    onPointerDown(_ctx, point, s) {
      lastStyle = { ...s }
      downPoint = { ...point }
    },

    onPointerMove() {
      // No drag preview: a marker is a single committed point.
    },

    onPointerUp(): Stroke | null {
      const style = lastStyle
      const center = downPoint
      lastStyle = null
      downPoint = null
      if (!style || !center) return null
      return buildStepMarkerStroke(center, style, opts.style())
    },
  }
}

/**
 * History-replay renderer. Reads `seq` / `size` / `fillColor` / `textColor`
 * back from the Stroke's extra-state index signature (TypeScript cannot infer
 * them).
 */
export function renderStepMarkerStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
): void {
  const center = stroke.points[0]
  if (!center) return
  const seq = (stroke.seq as number | undefined) ?? 1
  const style: StepMarkerStyle = {
    size: (stroke.size as number | undefined) ?? 32,
    fillColor: (stroke.fillColor as string | undefined) ?? '#e05020',
    textColor: (stroke.textColor as string | undefined) ?? '#ffffff',
  }
  paintMarker(ctx, center, seq, style)
}
