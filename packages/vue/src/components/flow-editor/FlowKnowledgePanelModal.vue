<script setup lang="ts">
import { Modal } from '@arco-design/web-vue'
import { nextTick, provide, ref, watch } from 'vue'
import FlowKnowledgePanelContent from './FlowKnowledgePanelContent.vue'
import FlowKnowledgeUploadDialogs from './FlowKnowledgeUploadDialogs.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const contentRef = ref<InstanceType<typeof FlowKnowledgePanelContent>>()
const uploadDialogsRef = ref<InstanceType<typeof FlowKnowledgeUploadDialogs>>()

provide('flowKnowledgeUpload', {
  openTxt: () => uploadDialogsRef.value?.openTxt(),
  openDoc: () => uploadDialogsRef.value?.openDoc(),
  closeAll: () => uploadDialogsRef.value?.closeAll()
})

watch(() => props.visible, async (open) => {
  if (!open) {
    uploadDialogsRef.value?.closeAll()
    return
  }
  await nextTick()
  await contentRef.value?.refresh()
  contentRef.value?.reloadTables()
})

function getCollectionName() {
  return contentRef.value?.getSelectedCollectionName() ?? ''
}

function onTxtUploaded() {
  contentRef.value?.reloadPoints()
}

function onDocUploaded() {
  contentRef.value?.reloadDocuments()
}
</script>

<template>
  <Modal
    :visible="visible"
    title="知识库配置"
    :width="1000"
    :footer="false"
    align-center
    modal-class="flow-knowledge-panel-modal"
    @update:visible="emit('update:visible', $event)"
  >
    <FlowKnowledgePanelContent ref="contentRef" :active="visible" />
  </Modal>

  <FlowKnowledgeUploadDialogs
    ref="uploadDialogsRef"
    :get-collection-name="getCollectionName"
    @txt-uploaded="onTxtUploaded"
    @doc-uploaded="onDocUploaded"
  />
</template>

<style lang="scss">
.flow-knowledge-panel-modal {
  .arco-modal-body {
    max-height: min(75vh, 680px);
    overflow: auto;
  }
}
</style>
