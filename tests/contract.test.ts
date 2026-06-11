import { describe, expect, it } from 'vitest'
import module, { MODULE_ID } from '../src/index'

describe('module contract', () => {
  it('declares the canonical plugin id matching plugin.json', () => {
    expect(MODULE_ID).toBe('@openpen/step-marker')
    expect(module.id).toBe('@openpen/step-marker')
  })

  it('declares a version', () => {
    expect(module.version).toBe('1.0.0')
  })

  it('contributes a step-marker tool with a custom renderStroke', () => {
    const tools = module.contributes.tools
    expect(tools).toBeDefined()
    const tool = tools!.find((t) => t.id === 'step-marker')
    expect(tool).toBeDefined()
    expect(typeof tool!.onPointerDown).toBe('function')
    expect(typeof tool!.onPointerUp).toBe('function')
    expect(typeof tool!.renderStroke).toBe('function')
  })

  it('contributes a step-marker cursor', () => {
    const cursors = module.contributes.cursors
    expect(cursors).toBeDefined()
    expect(cursors!.some((c) => c.id === 'step-marker')).toBe(true)
  })

  it('contributes a control-bar entry in the tools group (group on entry, not tool)', () => {
    const bar = module.contributes.controlBar
    expect(bar).toBeDefined()
    const entry = bar!.find((e) => e.id === 'step-marker')
    expect(entry).toBeDefined()
    expect(entry!.defaultGroup).toBe('tools')
    expect(entry!.component).toBeDefined()
    // The tool contribution itself MUST NOT carry layout fields.
    const tool = module.contributes.tools!.find((t) => t.id === 'step-marker')!
    expect('defaultGroup' in tool).toBe(false)
  })

  it('contributes a settings panel', () => {
    const panels = module.contributes.settingsPanels
    expect(panels).toBeDefined()
    const panel = panels!.find((p) => p.id === 'step-marker-settings')
    expect(panel).toBeDefined()
    expect(panel!.component).toBeDefined()
  })

  it('provides locale maps for all four supported languages', () => {
    const locales = module.contributes.locales
    expect(locales).toBeDefined()
    for (const lang of ['en', 'zh-Hant', 'zh-Hans', 'ja'] as const) {
      expect(locales![lang]).toBeDefined()
    }
  })
})

describe('settingsSchema', () => {
  it('parses to the documented defaults for an empty input', () => {
    const parsed = module.settingsSchema!.parse({})
    expect(parsed).toEqual({
      size: 32,
      fillColor: '#e05020',
      textColor: '#ffffff',
    })
  })

  it('rejects a size outside the 16..64 range', () => {
    expect(() => module.settingsSchema!.parse({ size: 8 })).toThrow()
    expect(() => module.settingsSchema!.parse({ size: 128 })).toThrow()
  })

  it('accepts overrides within range', () => {
    const parsed = module.settingsSchema!.parse({
      size: 48,
      fillColor: '#000000',
      textColor: '#ffffff',
    })
    expect(parsed.size).toBe(48)
    expect(parsed.fillColor).toBe('#000000')
  })
})
