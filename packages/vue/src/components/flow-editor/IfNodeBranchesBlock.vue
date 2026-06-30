<script setup lang="ts">
import { computed } from 'vue'
import type { TinyflowData } from '@tinyflow-ai/ui'
import { Button, Select, Textarea } from '@arco-design/web-vue'
import { IconDelete, IconPlus } from '@arco-design/web-vue/es/icon'
import {
  appendElseIfBranch,
  ifBranchTypeLabel,
  parseIfBranches,
  readBranchEdgeMap,
  readEdgeBranch,
  removeElseIfBranch,
  selectedEdgeIdForBranch,
  type IfBranchDef
} from '@flowgame/core'

const props = defineProps<{
  branches: IfBranchDef[]
  workflow?: TinyflowData
  nodeId?: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  replaceBranches: [branches: IfBranchDef[]]
  assignBranchEdge: [payload: { branchId: string, edgeId: string }]
}>()

const branchList = computed(() => parseIfBranches({ branches: props.branches }))

const outboundEdges = computed(() => {
  if (!props.nodeId)
    return []
  return (props.workflow?.edges ?? []).filter(e => e.source === props.nodeId)
})

const branchEdgeMap = computed(() => {
  const node = props.workflow?.nodes?.find(n => n.id === props.nodeId)
  return readBranchEdgeMap(node?.data as Record<string, unknown> | undefined)
})

function edgeForBranch(branchId: string) {
  const edgeId = selectedEdgeIdForBranch(branchId, outboundEdges.value, branchEdgeMap.value)
  if (edgeId)
    return outboundEdges.value.find(e => e.id === edgeId)
  return outboundEdges.value.find(e => readEdgeBranch(e) === branchId)
    ?? outboundEdges.value.find(e => readEdgeBranch(e).toLowerCase() === branchId.toLowerCase())
}

function edgeTargetLabel(targetId?: string) {
  if (!targetId)
    return '未连接'
  const target = (props.workflow?.nodes ?? []).find(n => n.id === targetId)
  if (!target)
    return targetId
  const title = target.data?.title
  return typeof title === 'string' && title.trim() ? title.trim() : (target.type || targetId)
}

function edgeOptionLabel(edge: { id?: string, target?: string }, currentBranchId: string) {
  const target = edgeTargetLabel(edge.target)
  const assignedTo = branchList.value.find(b => edgeForBranch(b.id)?.id === edge.id)
  if (assignedTo && assignedTo.id !== currentBranchId) {
    const idx = branchList.value.indexOf(assignedTo)
    return `→ ${target}（已分配给「${ifBranchTypeLabel(assignedTo.type, idx)}」）`
  }
  return `→ ${target}`
}

function patchBranch(index: number, patch: Partial<IfBranchDef>) {
  const next = branchList.value.map((b, i) => (i === index ? { ...b, ...patch } : b))
  emit('replaceBranches', next)
}

function addElseIf() {
  emit('replaceBranches', appendElseIfBranch(branchList.value))
}

function removeBranch(branch: IfBranchDef) {
  emit('replaceBranches', removeElseIfBranch(branchList.value, branch.id))
}

function assignEdge(edgeId: string | undefined, branchId: string) {
  emit('assignBranchEdge', { branchId, edgeId: edgeId?.trim() ?? '' })
}

const needEdgeCount = computed(() => branchList.value.length)
</script>

<template>
  <p class="flowgame-method-key-hint">
    条件参数与上方「输入参数」分开配置：先在输入参数中绑定上游变量，再在此用
    <code v-pre>{{ 参数名称 }}</code> 编写判断表达式（从上到下匹配，仅执行第一个成立的分支）。
  </p>

  <div class="flowgame-if-branches__section-title">
    条件表达式
  </div>

  <div class="flowgame-if-branches">
    <div
      v-for="(branch, index) in branchList"
      :key="`${branch.id}-cond`"
      class="flowgame-if-branches__row flowgame-if-branches__row--cond"
    >
      <div class="flowgame-if-branches__label">
        {{ ifBranchTypeLabel(branch.type, index) }}
      </div>
      <div class="flowgame-if-branches__body">
        <Textarea
          v-if="branch.type !== 'else'"
          :model-value="branch.condition ?? ''"
          :placeholder="index === 0 ? '例如：{{msg}} === \'success\'' : '例如：{{code}} === 500'"
          :auto-size="{ minRows: 2, maxRows: 6 }"
          :disabled="readonly"
          @update:model-value="(v: string) => patchBranch(index, { condition: v ?? '' })"
        />
        <div v-else class="flowgame-if-branches__else">
          前面条件均不成立时走此分支（无需条件）
        </div>
      </div>

      <Button
        v-if="branch.type === 'elseif' && !readonly"
        type="text"
        status="danger"
        size="small"
        class="flowgame-if-branches__remove"
        @click="removeBranch(branch)"
      >
        <template #icon>
          <IconDelete />
        </template>
      </Button>
      <div v-else class="flowgame-if-branches__remove-placeholder" />
    </div>
  </div>

  <Button
    v-if="!readonly"
    type="outline"
    size="small"
    class="flowgame-if-branches__add"
    @click="addElseIf"
  >
    <template #icon>
      <IconPlus />
    </template>
    添加否则如果
  </Button>

  <div class="flowgame-if-branches__section-title flowgame-if-branches__section-title--route">
    分支出边
  </div>

  <p class="flowgame-method-key-hint">
    请先从节点右侧连出 {{ needEdgeCount }} 条下游连线，再为每条分支选择对应出边。
  </p>

  <p v-if="outboundEdges.length < needEdgeCount" class="flowgame-if-branches__warn">
    当前已连出 {{ outboundEdges.length }} 条，尚需 {{ needEdgeCount - outboundEdges.length }} 条下游连线。
  </p>

  <div class="flowgame-if-branches flowgame-if-branches--routes">
    <div
      v-for="(branch, index) in branchList"
      :key="`${branch.id}-route`"
      class="flowgame-if-branches__row flowgame-if-branches__row--route"
    >
      <div class="flowgame-if-branches__label">
        {{ ifBranchTypeLabel(branch.type, index) }}
      </div>
      <div class="flowgame-if-branches__edge">
        <Select
          :model-value="edgeForBranch(branch.id)?.id ?? ''"
          :placeholder="outboundEdges.length ? '选择已连接的下游' : '请先从节点连出下游'"
          :disabled="readonly || !outboundEdges.length"
          allow-clear
          @change="(edgeId: string | undefined) => assignEdge(edgeId, branch.id)"
        >
          <Select.Option value="">
            无
          </Select.Option>
          <Select.Option
            v-for="edge in outboundEdges"
            :key="edge.id"
            :value="edge.id"
          >
            {{ edgeOptionLabel(edge, branch.id) }}
          </Select.Option>
        </Select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flowgame-if-branches {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flowgame-if-branches__section-title {
  margin: 4px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
}

.flowgame-if-branches__section-title--route {
  margin-top: 16px;
}

.flowgame-if-branches__warn {
  margin: 0 0 8px;
  font-size: 12px;
  color: rgb(var(--warning-6));
}

.flowgame-if-branches__row {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 8px;
  align-items: start;
}

.flowgame-if-branches__row--route {
  grid-template-columns: 72px 1fr;
  align-items: center;
}

.flowgame-if-branches__remove-placeholder {
  width: 28px;
}

.flowgame-if-branches__label {
  padding-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
}

.flowgame-if-branches__row--route .flowgame-if-branches__label {
  padding-top: 0;
}

.flowgame-if-branches__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flowgame-if-branches__else {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-3);
  background: var(--color-fill-2);
  border-radius: 4px;
}

.flowgame-if-branches__edge {
  min-width: 0;
}

.flowgame-if-branches__edge :deep(.arco-select) {
  width: 100%;
}

.flowgame-if-branches__add {
  margin-top: 4px;
}
</style>
