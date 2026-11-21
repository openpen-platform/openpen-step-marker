/**
 * Swatch lists for the control-bar options panel. The presets are the host
 * pen palette (white is only offered for the text color); a value saved
 * earlier outside the presets (for example a custom color picked in the old
 * settings page) is kept as one extra "current" cell in front, so the panel
 * shows exactly the stored value.
 */
export const PEN_COLORS = [
  '#F87171',
  '#FB923C',
  '#FBBF24',
  '#34D399',
  '#60A5FA',
  '#818CF8',
  '#F472B6',
  '#FFFFFF',
] as const

export const FILL_PRESETS: readonly string[] = PEN_COLORS.filter((c) => c !== '#FFFFFF')
export const TEXT_PRESETS: readonly string[] = PEN_COLORS

export interface SwatchItem {
  value: string
  /** True for the extra cell that holds a value outside the presets. */
  current: boolean
}

export function withCurrent(presets: readonly string[], value: string): SwatchItem[] {
  const items = presets.map((v) => ({ value: v, current: false }))
  const known = presets.some((v) => v.toLowerCase() === value.toLowerCase())
  return known ? items : [{ value, current: true }, ...items]
}
