<script setup lang="ts">
import { computed } from 'vue'
import { Message, Tree } from '@arco-design/web-vue'
import type { TinyflowData } from '@tinyflow-ai/ui'
import {
  buildWorkflowVariableTree,
  type WorkflowVariableTreeNode
} from './build-workflow-variable-tree'

const props = defineProps<{
  workflow?: TinyflowData
}>()

const treeSource = computed(() => buildWorkflowVariableTree(props.workflow ?? {}))

function toArcoTreeData(nodes: WorkflowVariableTreeNode[]): Array<{
  key: string
  title: string
  refPath?: string
  children?: ReturnType<typeof toArcoTreeData>
}> {
  return nodes.map(node => ({
    key: node.key,
    title: node.title,
    refPath: node.refPath,
    children: node.children?.length ? toArcoTreeData(node.children) : undefined
  }))
}

const arcoTreeData = computed(() => toArcoTreeData(treeSource.value))

async function copyRefPath(refPath: string) {
  try {
    await navigator.clipboard.writeText(refPath)
    Message.success(`已复制引用：${refPath}`)
  }
  catch {
    Message.error('复制失败，请检查浏览器权限')
  }
}

function handleNodeClick(
  _selectedKeys: Array<string | number>,
  data: { node?: { refPath?: string } }
) {
  const refPath = data.node?.refPath
  if (refPath)
    copyRefPath(refPath)
}
</script>

<template>
  <div class="flowgram-var-tree">
    <div v-if="arcoTreeData.length === 0" class="flowgram-var-tree__empty">
      暂无变量，请为节点配置输入/输出参数
    </div>
    <Tree
      v-else
      :data="arcoTreeData"
      :default-expand-all="true"
      block-node
      @select="handleNodeClick"
    >
      <template #title="nodeData">
        <span
          class="flowgram-var-tree__node-title"
          :class="{ 'flowgram-var-tree__node-title--copyable': nodeData.refPath }"
          :title="nodeData.refPath ? `点击复制 ${nodeData.refPath}` : nodeData.title"
        >
          {{ nodeData.title }}
        </span>
      </template>
    </Tree>
    <div class="flowgram-var-tree__hint">
      点击叶子变量可复制引用路径
    </div>
  </div>
</template>
