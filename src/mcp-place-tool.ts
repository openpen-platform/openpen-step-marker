/**
 * MCP tool `place` (listed to agents as `openpen.step-marker__place`): places
 * the next numbered step marker centred on a point given in screenshot pixels.
 *
 * The marker is built by `buildStepMarkerStroke`, the same function the
 * pointer tool uses, from the host's current pen style and the user's marker
 * settings, so an agent's marker looks like one the user would click at that
 * moment and takes the next number on the canvas. The stroke keeps the
 * `step-marker` tool id, so it is drawn by `renderStepMarkerStroke` and
 * `openpen__list_annotations` lists this plugin as its source.
 */
import { defineMcpTool, z } from '@openpen/module-api'
import type { StrokeStyle } from '@openpen/module-api'
import { commitStroke } from '@openpen/module-api/host'
import { buildStepMarkerStroke, type StepMarkerStyle } from './step-marker-tool'

export interface StepMarkerPlaceToolOptions {
  /** Returns the user's marker appearance at placement time. */
  style: () => StepMarkerStyle
  /** Returns the pen style the canvas would hand a manual click now. */
  penStyle: () => StrokeStyle
}

const inputSchema = z.object({
  x: z
    .number()
    .min(0)
    .describe('Centre X of the marker in screenshot pixels of the display, from the left edge.'),
  y: z
    .number()
    .min(0)
    .describe('Centre Y of the marker in screenshot pixels of the display, from the top edge.'),
})

const DESCRIPTION =
  'Places one numbered step marker on the screen: a filled circle with the next step number, centred on the given point. ' +
  'Suits marking the order of steps in a walkthrough, such as which button to press first, second and third. ' +
  'Places a single marker per call and always takes the next number (one more than the step markers already on the screen); the number, size and colours cannot be chosen. ' +
  'The marker stays until the user or another call removes it, and undo removes it like a hand-placed one, which also rolls the next number back. ' +
  'Coordinates are pixels of the display screenshot, origin at its top-left corner. ' +
  'Size and colours follow what the user set for the step marker tool. ' +
  'The result is the new annotation id and the number it shows.'

export function createStepMarkerPlaceTool(opts: StepMarkerPlaceToolOptions) {
  return defineMcpTool({
    name: 'place',
    title: 'mcp.placeTitle',
    description: DESCRIPTION,
    inputSchema,
    annotations: { readOnly: false, destructive: false, idempotent: false, openWorld: false },
    handler(args, ctx) {
      const center = ctx.toCanvas({ x: args.x, y: args.y })
      const stroke = buildStepMarkerStroke(center, opts.penStyle(), opts.style())
      commitStroke(stroke)
      return { id: stroke.id, seq: stroke.seq as number, displayId: ctx.displayId }
    },
  })
}

/** Usage guide returned by `openpen__get_guide({ plugin: '@openpen/step-marker' })`. */
export const STEP_MARKER_MCP_GUIDE = [
  'The step marker plugin places numbered circles with the same look as the Step Marker tool in the control bar.',
  '',
  'One call to place makes one marker with the next number: the first marker on an empty screen is 1, the next is 2, and so on. Place markers in the order the user should follow the steps. Take a screenshot first and read each centre point off it; to mark a control without hiding its label, put the marker just beside it.',
  '',
  'The number counts the step markers on the screen, so removing the last marker (undo or openpen__delete_annotation) makes the next call reuse its number. After removing a marker from the middle, the next call repeats a number already on the screen.',
  '',
  'Each marker is an annotation like any other: openpen__list_annotations lists it with source "@openpen/step-marker", and openpen__delete_annotation removes it by the id place returned.',
].join('\n')
