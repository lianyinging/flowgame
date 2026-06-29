<script setup lang="ts">
import { provide, ref } from 'vue'
import JsonTreeNode from './JsonTreeNode.vue'

const props = withDefaults(defineProps<{
  value: unknown
  defaultExpandDepth?: number
}>(), {
  defaultExpandDepth: 2
})

const expandDepth = ref(props.defaultExpandDepth)
const collapseAllToken = ref(0)

provide('jsonTreeContext', {
  expandDepth,
  collapseAllToken
})

function expandAll() {
  expandDepth.value = 64
}

function collapseAll() {
  collapseAllToken.value += 1
  expandDepth.value = 0
}

defineExpose({ expandAll, collapseAll })
</script>

<template>
  <div class="json-tree-viewer">
    <JsonTreeNode :value="value" :depth="0" />
  </div>
</template>

<style scoped lang="scss">
.json-tree-viewer {
  padding: 12px;
  min-height: 100%;
  background: var(--color-fill-2);
  border-radius: 6px;
}
</style>
