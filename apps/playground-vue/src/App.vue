<script setup lang="ts">
import { FlowEditor } from '@flowgame/vue'

function onSaved(payload: { flowName: string }) {
  console.info('[playground] saved', payload.flowName)
}

function onExecuted(payload: { phase: 'success' | 'error' }) {
  console.info('[playground] executed', payload.phase)
}
</script>

<template>
  <div class="flow-editor-host">
    <FlowEditor
      @saved="onSaved"
      @executed="onExecuted"
    />
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  height: 100%;
  overflow: hidden;
}
</style>
