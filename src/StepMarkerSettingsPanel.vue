<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModuleContext } from '@openpen/module-api'
import { AppSlider } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'

interface StepMarkerSettings {
  size: number
  fillColor: string
  textColor: string
}

const ctx = useModuleContext(MODULE_ID)

const size = ref(32)
const fillColor = ref('#e05020')
const textColor = ref('#ffffff')
let unsub: (() => void) | null = null

onMounted(() => {
  const s = ctx.getSettings<StepMarkerSettings>()
  size.value = s.size ?? 32
  fillColor.value = s.fillColor ?? '#e05020'
  textColor.value = s.textColor ?? '#ffffff'
  unsub = ctx.onSettingsChange<StepMarkerSettings>((next) => {
    size.value = next.size
    fillColor.value = next.fillColor
    textColor.value = next.textColor
  })
})

onUnmounted(() => unsub?.())

const sizeLabel = computed(() => ctx.t('settings.size'))
const fillColorLabel = computed(() => ctx.t('settings.fillColor'))
const textColorLabel = computed(() => ctx.t('settings.textColor'))

async function setSize(value: number) {
  size.value = value
  await ctx.updateSettings<StepMarkerSettings>({ size: value })
}

async function setFillColor(event: Event) {
  const value = (event.target as HTMLInputElement).value
  fillColor.value = value
  await ctx.updateSettings<StepMarkerSettings>({ fillColor: value })
}

async function setTextColor(event: Event) {
  const value = (event.target as HTMLInputElement).value
  textColor.value = value
  await ctx.updateSettings<StepMarkerSettings>({ textColor: value })
}
</script>

<template>
  <div class="step-marker-settings">
    <div class="step-marker-row">
      <div class="step-marker-row-label">{{ sizeLabel }}</div>
      <AppSlider
        :model-value="size"
        :min="16"
        :max="64"
        :step="1"
        width="120px"
        @update:model-value="setSize"
      />
    </div>
    <div class="step-marker-row">
      <div class="step-marker-row-label">{{ fillColorLabel }}</div>
      <input
        type="color"
        class="step-marker-color"
        :value="fillColor"
        :aria-label="fillColorLabel"
        @input="setFillColor"
      />
    </div>
    <div class="step-marker-row">
      <div class="step-marker-row-label">{{ textColorLabel }}</div>
      <input
        type="color"
        class="step-marker-color"
        :value="textColor"
        :aria-label="textColorLabel"
        @input="setTextColor"
      />
    </div>
  </div>
</template>

<style scoped>
.step-marker-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-marker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.step-marker-row-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--openpen-color-text-primary);
}

.step-marker-color {
  width: 36px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--openpen-color-border, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
</style>
