<script setup lang="ts">
/*
 * StepMarkerToolButton — tool button + caret + options popover.
 *
 * Same pattern as the spotlight and cursor-highlight plugins: an
 * `AppButtonDropdown` whose main button selects the step-marker tool and whose
 * caret opens a popover with the adjustments (fill color, text color, size).
 * Colors are one-click swatches; a stored color outside the presets (for
 * example one picked in the old settings page) stays as one "current" cell.
 *
 * Every change is written to this plugin's settings; the overlay follows via
 * onSettingsChange, so the next marker uses the new look.
 */
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { ACTIVE_TOOL_KEY, useModuleContext } from '@openpen/module-api'
import { emit } from '@openpen/module-api/host'
import {
  AppButtonDropdown,
  AppPopoverPanel,
  AppPopoverRow,
  AppSlider,
  AppSwatchPicker,
} from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'
import { createSerialQueue } from './serial-queue'
import { FILL_PRESETS, TEXT_PRESETS, withCurrent } from './swatches'

interface StepMarkerSettings {
  size: number
  fillColor: string
  textColor: string
}

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('tool'))
const optionsLabel = computed(() => ctx.t('options.label'))
const sizeLabel = computed(() => ctx.t('settings.size'))
const fillLabel = computed(() => ctx.t('settings.fillColor'))
const textLabel = computed(() => ctx.t('settings.textColor'))

const activeTool = inject(ACTIVE_TOOL_KEY)
const isActive = computed(() => activeTool?.value === 'step-marker')

function activate() {
  // Same two-step pattern as the built-in tool buttons: the event-bus emit
  // updates this window's active-tool state (control-bar highlight, other
  // modules' tool-changed teardown); the IPC relays the tool to the overlay.
  emit('tool-changed', { tool: 'step-marker' })
  window.openPenApi?.setActiveTool({ tool: 'step-marker' })
}

/** Opening the options also selects the tool, so the adjustments apply to what is drawn next. */
function activateIfNeeded() {
  if (!isActive.value) activate()
}

// One write at a time: the host merges a patch into a cache that only updates after the previous write.
const enqueue = createSerialQueue()
const save = (patch: Partial<StepMarkerSettings>) => enqueue(() => ctx.updateSettings<StepMarkerSettings>(patch))

const size = ref(32)
const fillColor = ref('#e05020')
const textColor = ref('#ffffff')

function apply(s: Partial<StepMarkerSettings>) {
  size.value = s.size ?? 32
  fillColor.value = s.fillColor ?? '#e05020'
  textColor.value = s.textColor ?? '#ffffff'
}

let unsub: (() => void) | null = null
onMounted(() => {
  apply(ctx.getSettings<StepMarkerSettings>())
  unsub = ctx.onSettingsChange<StepMarkerSettings>(apply)
})
onUnmounted(() => unsub?.())

function toSwatches(kind: string, presets: readonly string[], value: string) {
  return withCurrent(presets, value).map((item) => ({
    value: item.value,
    label: item.current
      ? ctx.t('settings.current')
      : ctx.t(`colors.${item.value.slice(1).toLowerCase()}`),
    testid: `step-marker-${kind}-swatch-${item.current ? 'current' : item.value.slice(1).toLowerCase()}`,
  }))
}

const fillSwatches = computed(() => toSwatches('fill', FILL_PRESETS, fillColor.value))
const textSwatches = computed(() => toSwatches('text', TEXT_PRESETS, textColor.value))

async function setFill(value: string) {
  fillColor.value = value
  await save({ fillColor: value })
}

async function setText(value: string) {
  textColor.value = value
  await save({ textColor: value })
}

async function setSize(value: number) {
  const next = Math.min(64, Math.max(16, Math.round(Number(value))))
  size.value = next
  await save({ size: next })
}
</script>

<template>
  <AppButtonDropdown
    popover-id="openpen-step-marker-options"
    popover-placement="auto"
    :active="isActive"
    :main-tooltip="label"
    :main-aria-label="label"
    :caret-aria-label="optionsLabel"
    main-testid="controlbar-step-marker-btn"
    caret-testid="controlbar-step-marker-caret"
    @main-click="activate"
    @caret-click="activateIfNeeded"
  >
    <template #main-content>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <text x="12" y="12" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="bold" fill="currentColor" stroke="none">1</text>
      </svg>
    </template>
    <template #popover-content>
      <AppPopoverPanel data-testid="controlbar-step-marker-popover">
        <AppPopoverRow :label="fillLabel">
          <AppSwatchPicker
            :model-value="fillColor"
            :colors="fillSwatches"
            :aria-label="fillLabel"
            testid="step-marker-fill-swatches"
            @update:model-value="setFill"
          />
        </AppPopoverRow>
        <AppPopoverRow :label="textLabel">
          <AppSwatchPicker
            :model-value="textColor"
            :colors="textSwatches"
            :aria-label="textLabel"
            testid="step-marker-text-swatches"
            @update:model-value="setText"
          />
        </AppPopoverRow>
        <AppPopoverRow :label="sizeLabel">
          <AppSlider
            :model-value="size"
            :min="16"
            :max="64"
            :step="1"
            :value-label="`${size}px`"
            :ariaLabel="sizeLabel"
            data-testid="step-marker-size-slider"
            @update:model-value="setSize"
          />
        </AppPopoverRow>
      </AppPopoverPanel>
    </template>
  </AppButtonDropdown>
</template>
