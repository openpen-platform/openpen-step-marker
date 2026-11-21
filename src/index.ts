/**
 * @openpen/step-marker — sequentially numbered step markers.
 *
 * Contributes:
 *   - The step-marker `Tool` to `canvas.tools` (custom `renderStroke` draws a
 *     filled disc with a centered number; the host fallback polyline cannot).
 *   - A crosshair-style cursor for `ui.cursors`.
 *   - A tool button in the control bar 'tools' group.
 *   - A settings panel (size + fill / text color) for `ui.settings.panels`.
 *   - The MCP tool `place` (`openpen.step-marker__place` for agents) and its
 *     usage guide: an agent places the same marker stroke a manual click makes.
 *
 * Size / colors are config (not in-progress stroke state), so they live in a
 * module-scoped holder hydrated from settings in setup(); the tool factory
 * reads them at commit time via an accessor closure.
 */
import { defineModule, z } from '@openpen/module-api'
export { MODULE_ID } from './module-id'
import { MODULE_ID } from './module-id'
import {
  createStepMarkerTool,
  renderStepMarkerStroke,
  type StepMarkerStyle,
} from './step-marker-tool'
import { createStepMarkerPlaceTool, STEP_MARKER_MCP_GUIDE } from './mcp-place-tool'
import { currentPenStyle, trackPenStyle } from './pen-style'
import StepMarkerToolButton from './StepMarkerToolButton.vue'
import StepMarkerSettingsPanel from './StepMarkerSettingsPanel.vue'
import en from './locales/en.json'
import zhHant from './locales/zh-Hant.json'
import zhHans from './locales/zh-Hans.json'
import ja from './locales/ja.json'

const settingsSchema = z.object({
  size: z.number().min(16).max(64).default(32),
  fillColor: z.string().default('#e05020'),
  textColor: z.string().default('#ffffff'),
})
type StepMarkerSettings = z.infer<typeof settingsSchema>

const liveSettings: StepMarkerStyle = {
  size: 32,
  fillColor: '#e05020',
  textColor: '#ffffff',
}

const liveStyle = () => ({ ...liveSettings })

const stepMarkerTool = createStepMarkerTool({ style: liveStyle })
const placeTool = createStepMarkerPlaceTool({ style: liveStyle, penStyle: currentPenStyle })

const STEP_MARKER_CURSOR = {
  svg:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">' +
    '<circle cx="12" cy="12" r="9" fill="#e05020" stroke="#ffffff" stroke-width="2"/>' +
    '<text x="12" y="13" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">1</text>' +
    '</svg>',
  hotspot: { x: 12, y: 12 },
  fallback: 'crosshair',
}

export default defineModule({
  id: MODULE_ID,
  version: '1.0.1',
  settingsSchema,
  mcpGuide: STEP_MARKER_MCP_GUIDE,

  setup(ctx) {
    ctx.onDispose(trackPenStyle())
    const apply = (s: StepMarkerSettings) => {
      liveSettings.size = s.size
      liveSettings.fillColor = s.fillColor
      liveSettings.textColor = s.textColor
    }
    apply(ctx.getSettings<StepMarkerSettings>())
    const stop = ctx.onSettingsChange<StepMarkerSettings>(apply)
    ctx.onDispose(stop)
  },

  contributes: {
    tools: [
      {
        id: 'step-marker',
        label: {
          en: 'Step Marker',
          'zh-Hant': '步驟標記',
          'zh-Hans': '步骤标记',
          ja: 'ステップ番号',
        },
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="12" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="bold" fill="currentColor" stroke="none">1</text></svg>',
        ...stepMarkerTool,
        renderStroke: renderStepMarkerStroke,
      },
    ],
    cursors: [
      {
        id: 'step-marker',
        cursor: STEP_MARKER_CURSOR,
      },
    ],
    controlBar: [
      {
        id: 'step-marker',
        component: StepMarkerToolButton,
        defaultGroup: 'tools',
        groupHint: { separator: 'auto' },
      },
    ],
    settingsPanels: [
      {
        id: 'step-marker-settings',
        label: {
          en: 'Step Marker',
          'zh-Hant': '步驟標記',
          'zh-Hans': '步骤标记',
          ja: 'ステップ番号',
        },
        component: StepMarkerSettingsPanel,
      },
    ],
    mcpTools: [placeTool],
    locales: {
      en,
      'zh-Hant': zhHant,
      'zh-Hans': zhHans,
      ja,
    },
  },
})
