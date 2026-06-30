<script setup lang="ts">
import { computed } from 'vue'
import type { TinyflowData } from '@tinyflow-ai/ui'
import { Button, Input, Select } from '@arco-design/web-vue'
import { IconDelete, IconPlus } from '@arco-design/web-vue/es/icon'
import {
  SWITCH_ELSE_CASE_ID,
  appendSwitchCase,
  parseSwitchCases,
  readBranchEdgeMap,
  readEdgeBranch,
  removeSwitchCase,
  selectedEdgeIdForBranch,
  type SwitchCaseDef
} from '@flowgame/core'

const props = defineProps<{
  cases: SwitchCaseDef[]
  workflow?: TinyflowData
  nodeId?: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  replaceCases: [cases: SwitchCaseDef[]]
  assignBranchEdge: [payload: { branchId: string, edgeId: string }]
}>()

const caseList = computed(() => parseSwitchCases({ cases: props.cases }))

const outboundEdges = computed(() => {
  if (!props.nodeId)
    return []
  return (props.workflow?.edges ?? []).filter(e => e.source === props.nodeId)
})

const needEdgeCount = computed(() => caseList.value.length + 1)

const branchEdgeMap = computed(() => {
  const node = props.workflow?.nodes?.find(n => n.id === props.nodeId)
  return readBranchEdgeMap(node?.data as Record<string, unknown> | undefined)
})

function edgeForBranch(branchId: string) {
  const edgeId = selectedEdgeIdForBranch(branchId, outboundEdges.value, branchEdgeMap.value)
  if (edgeId)
    return outboundEdges.value.find(e => e.id === edgeId)
  return outboundEdges.value.find(e => readEdgeBranch(e) === branchId)
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

function edgeOptionLabel(edge: { id?: string, target?: string }, branchId: string) {
  const target = edgeTargetLabel(edge.target)
  const takenBy = caseList.value.find(c => edgeForBranch(c.id)?.id === edge.id)
  if (takenBy && takenBy.id !== branchId) {
    const idx = caseList.value.indexOf(takenBy)
    return `→ ${target}（已分配给 case ${idx + 1}）`
  }
  if (branchId === SWITCH_ELSE_CASE_ID) {
    const elseTaken = edgeForBranch(SWITCH_ELSE_CASE_ID)?.id === edge.id
    if (!elseTaken && edgeForBranch(SWITCH_ELSE_CASE_ID))
      return `→ ${target}`
  }
  return `→ ${target}`
}

function patchCase(index: number, patch: Partial<SwitchCaseDef>) {
  const next = caseList.value.map((c, i) => (i === index ? { ...c, ...patch } : c))
  emit('replaceCases', next)
}

function addCase() {
  emit('replaceCases', appendSwitchCase(caseList.value))
}

function removeCase(caseDef: SwitchCaseDef) {
  emit('replaceCases', removeSwitchCase(caseList.value, caseDef.id))
}

function assignEdge(edgeId: string | undefined, branchId: string) {
  emit('assignBranchEdge', { branchId, edgeId: edgeId?.trim() ?? '' })
}
</script>

<template>
  <p class="flowgame-method-key-hint">
    「匹配变量」填写 {{ 参数名 }}（与上方输入参数对应），将变量值与各 case 匹配值做字符串相等比较；case 匹配值也支持 {{参数名}}。
    请先从节点右侧连出 {{ needEdgeCount }} 条连线，再为每个分支选择对应出边。
  </p>

  <p v-if="outboundEdges.length < needEdgeCount" class="flowgame-switch-cases__warn">
    当前已连出 {{ outboundEdges.length }} 条，尚需 {{ needEdgeCount - outboundEdges.length }} 条下游连线。
  </p>

  <div class="flowgame-switch-cases">
    <div
      v-for="(caseDef, index) in caseList"
      :key="caseDef.id"
      class="flowgame-switch-cases__row"
    >
      <div class="flowgame-switch-cases__label">
        case {{ index + 1 }}
      </div>
      <div class="flowgame-switch-cases__body">
        <Input
          :model-value="caseDef.label ?? ''"
          placeholder="显示名（可选）"
          :disabled="readonly"
          @update:model-value="(v: string) => patchCase(index, { label: v })"
        />
        <Input
          :model-value="caseDef.value"
          placeholder="匹配值，例如 success 或 {{expected}}"
          :disabled="readonly"
          @update:model-value="(v: string) => patchCase(index, { value: v })"
        />
        <div class="flowgame-switch-cases__edge">
          <span class="flowgame-switch-cases__edge-label">下游</span>
          <Select
            :model-value="edgeForBranch(caseDef.id)?.id ?? ''"
            :placeholder="outboundEdges.length ? '选择已连接的下游' : '请先从节点连出下游'"
            :disabled="readonly || !outboundEdges.length"
            allow-clear
            @change="(edgeId: string | undefined) => assignEdge(edgeId, caseDef.id)"
          >
            <Select.Option value="">
              无
            </Select.Option>
            <Select.Option
              v-for="edge in outboundEdges"
              :key="edge.id"
              :value="edge.id"
            >
              {{ edgeOptionLabel(edge, caseDef.id) }}
            </Select.Option>
          </Select>
        </div>
      </div>
      <Button
        v-if="caseList.length > 1 && !readonly"
        type="text"
        status="danger"
        size="small"
        @click="removeCase(caseDef)"
      >
        <template #icon>
          <IconDelete />
        </template>
      </Button>
    </div>

    <div class="flowgame-switch-cases__row">
      <div class="flowgame-switch-cases__label">
        否则
      </div>
      <div class="flowgame-switch-cases__body">
        <div class="flowgame-switch-cases__else">
          未匹配任何 case 时走此分支
        </div>
        <div class="flowgame-switch-cases__edge">
          <span class="flowgame-switch-cases__edge-label">下游</span>
          <Select
            :model-value="edgeForBranch(SWITCH_ELSE_CASE_ID)?.id ?? ''"
            :placeholder="outboundEdges.length ? '选择已连接的下游' : '请先从节点连出下游'"
            :disabled="readonly || !outboundEdges.length"
            allow-clear
            @change="(edgeId: string | undefined) => assignEdge(edgeId, SWITCH_ELSE_CASE_ID)"
          >
            <Select.Option value="">
              无
            </Select.Option>
            <Select.Option
              v-for="edge in outboundEdges"
              :key="edge.id"
              :value="edge.id"
            >
              {{ edgeOptionLabel(edge, SWITCH_ELSE_CASE_ID) }}
            </Select.Option>
          </Select>
        </div>
      </div>
    </div>
  </div>

  <Button
    v-if="!readonly"
    type="outline"
    size="small"
    class="flowgame-switch-cases__add"
    @click="addCase"
  >
    <template #icon>
      <IconPlus />
    </template>
    添加 case
  </Button>
</template>

<style scoped>
.flowgame-switch-cases {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flowgame-switch-cases__warn {
  margin: 0 0 8px;
  font-size: 12px;
  color: rgb(var(--warning-6));
}

.flowgame-switch-cases__row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 8px;
  align-items: start;
}

.flowgame-switch-cases__label {
  padding-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-2);
}

.flowgame-switch-cases__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flowgame-switch-cases__else {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-text-3);
  background: var(--color-fill-2);
  border-radius: 4px;
}

.flowgame-switch-cases__edge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flowgame-switch-cases__edge-label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-3);
}

.flowgame-switch-cases__edge :deep(.arco-select) {
  flex: 1;
}

.flowgame-switch-cases__add {
  margin-top: 4px;
}
</style>
