<script setup lang="ts">
import { computed } from 'vue'
import {
  Collapse,
  CollapseItem,
  Modal,
  Progress,
  Spin,
  Tag
} from '@arco-design/web-vue'
import { getNodeIconHtml, getNodeTypeLabel } from '@flowgame/core'
import type { FlowNodeExecution, FlowRunPhase, FlowRunPlanNode, FlowRunSummary } from '@flowgame/core'

const props = defineProps<{
  visible: boolean
  phase: FlowRunPhase
  plan: FlowRunPlanNode[]
  executions: FlowNodeExecution[]
  summary: FlowRunSummary | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const executionById = computed(() => {
  const map = new Map<string, FlowNodeExecution>()
  for (const item of props.executions)
    map.set(item.nodeId, item)
  return map
})

interface DisplayRow {
  id: string
  type?: string
  label: string
  status: FlowNodeExecution['status']
  durationMs?: number
  output?: Record<string, unknown>
  error?: string
}

const displayRows = computed<DisplayRow[]>(() => {
  const execMap = executionById.value
  if (props.plan.length) {
    return props.plan.map((node) => {
      const exec = execMap.get(node.id)
      const status: FlowNodeExecution['status'] = exec?.status
        ?? (props.phase === 'running' ? 'pending' : 'skipped')
      return {
        id: node.id,
        type: node.type ?? exec?.nodeType,
        label: exec?.nodeName || node.label,
        status,
        durationMs: exec?.durationMs,
        output: exec?.output,
        error: exec?.error
      }
    })
  }
  return props.executions.map(exec => ({
    id: exec.nodeId,
    type: exec.nodeType,
    label: exec.nodeName || getNodeTypeLabel(exec.nodeType) || exec.nodeId,
    status: exec.status,
    durationMs: exec.durationMs,
    output: exec.output,
    error: exec.error
  }))
})

const runProgressStats = computed(() => {
  const rows = displayRows.value
  const total = rows.length
  const done = rows.filter(r =>
    r.status === 'success' || r.status === 'error' || r.status === 'skipped'
  ).length
  const running = rows.filter(r => r.status === 'running').length
  return { total, done, running }
})

function clampPercent(value: number, max = 100) {
  return Math.min(max, Math.max(0, Math.round(value)))
}

const progressPercent = computed(() => {
  const { total, done, running } = runProgressStats.value
  if (!total)
    return props.phase === 'success' ? 100 : 0
  // 已结束：固定 100%（避免 done < plan 行数时进度条不满）
  if (props.phase !== 'running')
    return 100
  // 运行中：已完成 1 权重，执行中 0.5 权重，最高 99%（收到 workflow_finished 后再到 100%）
  const weighted = done + (running > 0 ? 0.5 : 0)
  return clampPercent((weighted / total) * 100, 99)
})

/** Arco Progress 的 percent 为 0～1，内部展示会再 ×100 */
const progressRatio = computed(() => (progressPercent.value ?? 0) / 100)

const progressStatus = computed(() => {
  if (props.phase === 'running')
    return 'normal' as const
  if (props.phase === 'error')
    return 'danger' as const
  return 'success' as const
})

const headerStatusText = computed(() => {
  if (props.phase === 'running') {
    const { done, total, running } = runProgressStats.value
    if (total > 0)
      return `正在执行工作流…（${done}/${total} 已完成${running ? `，${running} 个执行中` : ''}）`
    return '正在执行工作流…'
  }
  if (props.phase === 'error')
    return props.summary?.message || '执行失败'
  return props.summary?.message || '执行完成'
})

const workflowStatusTag = computed(() => {
  const status = (props.summary?.status ?? '').toUpperCase()
  if (props.phase === 'running')
    return { color: 'arcoblue', text: '运行中' }
  if (status === 'FINISHED_NORMAL' || props.phase === 'success')
    return { color: 'green', text: '成功' }
  if (status === 'SUSPEND')
    return { color: 'orange', text: '已挂起' }
  return { color: 'red', text: '异常' }
})

function statusLabel(status: FlowNodeExecution['status']) {
  const map: Record<FlowNodeExecution['status'], string> = {
    pending: '等待',
    running: '执行中',
    success: '成功',
    error: '失败',
    skipped: '跳过'
  }
  return map[status] ?? status
}

function statusColor(status: FlowNodeExecution['status']) {
  if (status === 'success')
    return 'green'
  if (status === 'error')
    return 'red'
  if (status === 'skipped')
    return 'gray'
  if (status === 'running')
    return 'arcoblue'
  return 'gray'
}

function formatOutput(output?: Record<string, unknown>) {
  if (!output || !Object.keys(output).length)
    return '（无输出）'
  try {
    return JSON.stringify(output, null, 2)
  }
  catch {
    return String(output)
  }
}

</script>

<template>
  <Modal
    :visible="visible"
    title="试运行"
    width="800px"
    :footer="false"
    unmount-on-close
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flow-run-modal">
      <div class="flow-run-modal__header">
        <div class="flow-run-modal__header-main">
          <Spin v-if="phase === 'running'" :size="18" />
          <span class="flow-run-modal__status-text">{{ headerStatusText }}</span>
          <Tag :color="workflowStatusTag.color">
            {{ workflowStatusTag.text }}
          </Tag>
        </div>
        <Progress
          :percent="progressRatio"
          :status="progressStatus"
          :show-text="true"
          :animation="phase === 'running' && progressPercent < 100"
        />
        <p v-if="phase === 'running'" class="flow-run-modal__hint">
          流式执行中，节点完成后将实时更新状态与输出。
        </p>
      </div>

      <div class="flow-run-modal__nodes">
        <div
          v-for="(row, index) in displayRows"
          :key="row.id"
          class="flow-run-node"
          :class="`flow-run-node--${row.status}`"
        >
          <div class="flow-run-node__head">
            <span class="flow-run-node__index">{{ index + 1 }}</span>
            <span
              v-if="getNodeIconHtml(row.type)"
              class="flow-run-node__icon"
              v-html="getNodeIconHtml(row.type)"
            />
            <div class="flow-run-node__title-wrap">
              <span class="flow-run-node__title">{{ row.label }}</span>
              <span v-if="row.type" class="flow-run-node__type">{{ getNodeTypeLabel(row.type) }}</span>
            </div>
            <Tag size="small" :color="statusColor(row.status)">
              {{ statusLabel(row.status) }}
            </Tag>
            <span v-if="row.durationMs != null" class="flow-run-node__duration">
              {{ row.durationMs }} ms
            </span>
          </div>

          <p v-if="row.error" class="flow-run-node__error">
            {{ row.error }}
          </p>

          <Collapse
            v-if="phase !== 'running' && (row.output || row.error)"
            :bordered="false"
            class="flow-run-node__detail"
          >
            <CollapseItem header="节点输出详情" key="output">
              <pre class="flow-run-node__pre">{{ formatOutput(row.output) }}</pre>
            </CollapseItem>
          </Collapse>
        </div>

        <p v-if="!displayRows.length && phase !== 'running'" class="flow-run-modal__empty">
          未记录到节点执行轨迹
        </p>
      </div>

    </div>
  </Modal>
</template>

<style scoped lang="scss">
.flow-run-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
}

.flow-run-modal__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flow-run-modal__header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.flow-run-modal__status-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.flow-run-modal__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-3);
}

.flow-run-modal__nodes {
  flex: 1;
  min-height: 120px;
  max-height: 48vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

.flow-run-node {
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--color-bg-2);

  &--running {
    border-color: rgb(var(--primary-6));
    background: rgba(var(--primary-6), 0.04);
  }

  &--error {
    border-color: rgb(var(--danger-6));
    background: rgba(var(--danger-6), 0.04);
  }

  &--success {
    border-color: var(--color-border-2);
  }

  &--skipped {
    opacity: 0.72;
  }
}

.flow-run-node__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-run-node__index {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-fill-3);
  font-size: 12px;
  line-height: 22px;
  text-align: center;
  color: var(--color-text-2);
}

.flow-run-node__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--primary-6));

  :deep(svg) {
    width: 18px;
    height: 18px;
  }
}

.flow-run-node__title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-run-node__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-run-node__type {
  font-size: 11px;
  color: var(--color-text-3);
}

.flow-run-node__duration {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-text-3);
}

.flow-run-node__error {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgb(var(--danger-6));
  line-height: 1.5;
}

.flow-run-node__detail {
  margin-top: 8px;
}

.flow-run-node__pre {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  padding: 8px;
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--color-fill-2);
  border-radius: 4px;
}

.flow-run-modal__empty {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-3);
}

</style>
