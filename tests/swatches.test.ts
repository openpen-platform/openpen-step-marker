import { describe, expect, it } from 'vitest'
import { FILL_PRESETS, TEXT_PRESETS, withCurrent } from '../src/swatches'

describe('swatch lists', () => {
  it('fill presets are the pen colors without white; text presets add white', () => {
    expect(FILL_PRESETS).toHaveLength(7)
    expect(FILL_PRESETS).not.toContain('#FFFFFF')
    expect(TEXT_PRESETS).toHaveLength(8)
    expect(TEXT_PRESETS[7]).toBe('#FFFFFF')
  })

  it('keeps a plain preset list when the value is one of the presets (case-insensitive)', () => {
    const items = withCurrent(TEXT_PRESETS, '#ffffff')
    expect(items).toHaveLength(8)
    expect(items.some((i) => i.current)).toBe(false)
  })

  it('puts a value outside the presets first as the "current" cell', () => {
    const items = withCurrent(FILL_PRESETS, '#e05020')
    expect(items).toHaveLength(8)
    expect(items[0]).toEqual({ value: '#e05020', current: true })
  })

  it('a pre-upgrade custom color survives unchanged as the current cell', () => {
    const items = withCurrent(TEXT_PRESETS, '#123456')
    expect(items[0].value).toBe('#123456')
    expect(items[0].current).toBe(true)
  })
})
