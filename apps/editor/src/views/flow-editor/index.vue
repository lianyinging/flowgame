<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FlowEditor } from '@flowgame/vue'
import type { FlowEditorFormMode } from '@flowgame/vue'
import type { FlowListIndexItem } from '@flowgame/core'
import type { IFormType } from '@/api/types'
import FlowListPanelModal from './FlowListPanelModal.vue'
import FlowKnowledgePanelModal from './FlowKnowledgePanelModal.vue'

const route = useRoute()
const editorRef = ref<InstanceType<typeof FlowEditor>>()

const readonly = computed(() => route.query.mode === 'view')
const redisKey = computed(() =>
  typeof route.query.redisKey === 'string' ? route.query.redisKey.trim() : ''
)
const flowName = computed(() =>
  typeof route.query.name === 'string' ? route.query.name.trim() : ''
)

const flowListPanelVisible = ref(false)
const flowKnowledgePanelVisible = ref(false)

function onOpenFlowList() {
  flowListPanelVisible.value = true
}

function onOpenFlowKnowledge() {
  flowKnowledgePanelVisible.value = true
}

function onOpenFlowFromList(payload: { mode: IFormType, record?: FlowListIndexItem }) {
  editorRef.value?.openFlowFromListPanel({
    mode: payload.mode as FlowEditorFormMode,
    record: payload.record
  })
}
</script>

<template>
  <FlowEditor
    ref="editorRef"
    :readonly="readonly"
    :redis-key="redisKey"
    :flow-name="flowName"
    @open-flow-list="onOpenFlowList"
    @open-flow-knowledge="onOpenFlowKnowledge"
  />

  <FlowListPanelModal
    v-model:visible="flowListPanelVisible"
    :editor-readonly="readonly"
    @open="onOpenFlowFromList"
  />

  <FlowKnowledgePanelModal v-model:visible="flowKnowledgePanelVisible" />
</template>
