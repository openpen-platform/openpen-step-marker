/**
 * Pure numbering logic for the step-marker tool.
 *
 * The sequence number is derived from the canvas state — the count of existing
 * step-marker strokes plus one — never from a standalone counter. Host undo /
 * redo is LIFO, so a count-derived number stays in sync automatically: undoing
 * the last marker drops the count, and the next placement reuses that number.
 */
import type { Stroke } from '@openpen/module-api'

/** Tool id shared by the contribution, the committed Stroke, and the renderer. */
export const STEP_MARKER_TOOL_ID = 'step-marker'

/** Count the step-marker strokes already present on the canvas. */
export function countStepMarkers(strokes: readonly Stroke[]): number {
  let count = 0
  for (const stroke of strokes) {
    if (stroke.tool === STEP_MARKER_TOOL_ID) count++
  }
  return count
}

/**
 * Derive the sequence number for the next marker: existing step-marker count
 * plus one. Numbering starts at 1 on an empty canvas.
 *
 * Numbering is intentionally count-based rather than a monotonic counter so it
 * stays consistent with the host's LIFO undo / redo. The tradeoff: deleting a
 * mid-sequence marker leaves its number absent on already-placed neighbours
 * (their `seq` is fixed at commit time) while the next placement reuses the
 * now-vacated count, so live numbers can show a gap until the canvas is
 * re-laid. Swapping this for a standalone counter would restore gapless numbers
 * but desync from undo (numbers would skip after every undo) — do not "fix" it
 * that way.
 */
export function deriveSeq(existingStrokes: readonly Stroke[]): number {
  return countStepMarkers(existingStrokes) + 1
}
