/**
 * The host's current pen style as this window's canvas sees it.
 *
 * A manual click hands the tool the canvas's own style mirror, which follows
 * two sources: `stroke-style-changed` on this window's event bus (seeded from
 * settings at boot) and the cross-window style broadcast (the control-bar
 * colour picker and width slider live in another window). `useStrokeStyle()`
 * only follows the first, so in the overlay it misses control-bar changes.
 * This mirror follows both, so a marker an agent places carries the style a
 * manual marker would carry at that moment.
 */
import { on, useStrokeStyle } from '@openpen/module-api/host'
import type { StrokeColor, StrokeStyle } from '@openpen/module-api'

let latestColor: StrokeColor | null = null
let latestWidth: number | null = null

function accept(style: { color?: unknown; lineWidth?: unknown } | null | undefined): void {
  const color = style?.color
  if (typeof color === 'string' || (typeof color === 'object' && color !== null)) {
    latestColor = color as StrokeColor
  }
  const width = style?.lineWidth
  if (typeof width === 'number' && Number.isFinite(width)) latestWidth = width
}

/** Start following the pen style; returns the unsubscribe function. */
export function trackPenStyle(): () => void {
  latestColor = null
  latestWidth = null
  const offBus = on('stroke-style-changed', (payload) => {
    accept(payload as { color?: unknown; lineWidth?: unknown } | null)
  })
  // Not every window has the preload bridge (unit tests run without a window).
  const api = typeof window === 'undefined' ? undefined : window.openPenApi
  const offIpc = api?.onStrokeStyleChanged?.((style) => accept(style))
  return () => {
    offBus()
    offIpc?.()
  }
}

/**
 * The style the canvas would hand the tool for a manual stroke now: the last
 * colour and width seen, else the host's initial values.
 */
export function currentPenStyle(): StrokeStyle {
  const host = useStrokeStyle()
  return {
    color: latestColor ?? host.color.value,
    lineWidth: latestWidth ?? host.lineWidth.value,
    lineCap: 'round',
    lineJoin: 'round',
  }
}
