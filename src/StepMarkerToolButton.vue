<script setup lang="ts">
import { computed, inject } from 'vue'
import { ACTIVE_TOOL_KEY, useModuleContext } from '@openpen/module-api'
import { emit } from '@openpen/module-api/host'
import { AppButton } from '@openpen/module-api/uikit'
import { MODULE_ID } from './module-id'

const ctx = useModuleContext(MODULE_ID)
const label = computed(() => ctx.t('tool'))

const activeTool = inject(ACTIVE_TOOL_KEY)
const isActive = computed(() => activeTool?.value === 'step-marker')

function activate() {
  // Same two-step pattern as the built-in tool buttons: the event-bus emit
  // updates this window's active-tool state (control-bar highlight, other
  // modules' tool-changed teardown); the IPC relays the tool to the overlay.
  emit('tool-changed', { tool: 'step-marker' })
  window.openPenApi?.setActiveTool({ tool: 'step-marker' })
}
</script>

<template>
  <AppButton
    :active="isActive"
    :tooltip="label"
    :aria-label="label"
    data-testid="controlbar-step-marker-btn"
    @click="activate"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="12" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="bold" fill="currentColor" stroke="none">1</text>
    </svg>
  </AppButton>
</template>
