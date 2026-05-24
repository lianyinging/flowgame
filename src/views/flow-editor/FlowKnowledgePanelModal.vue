<script setup lang="ts">
import { Modal } from '@arco-design/web-vue'
import { nextTick, ref, watch } from 'vue'
import FlowKnowledgePanelContent from '../FlowKnowledgePanelContent.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const contentRef = ref<InstanceType<typeof FlowKnowledgePanelContent>>()

watch(() => props.visible, async (open) => {
  if (!open)
    return
  await nextTick()
  await contentRef.value?.refresh()
  contentRef.value?.reloadTables()
})
</script>

<template>
  <Modal
    :visible="visible"
    title="知识库配置"
    :width="1000"
    :footer="false"
    unmount-on-close
    align-center
    modal-class="flow-knowledge-panel-modal"
    @update:visible="emit('update:visible', $event)"
  >
    <FlowKnowledgePanelContent ref="contentRef" :active="visible" />
  </Modal>
</template>

<style lang="scss">
.flow-knowledge-panel-modal {
  .arco-modal-body {
    max-height: min(75vh, 680px);
    overflow: auto;
  }
}
</style>
