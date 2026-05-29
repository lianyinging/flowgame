import type { FlowNodeExecution, FlowRunSummary } from './flow-run-types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function normalizeExecutionStatus(value: unknown): FlowNodeExecution['status'] {
  const text = String(value ?? '').toLowerCase()
  if (text === 'success')
    return 'success'
  if (text === 'error' || text === 'failed' || text === 'failure')
    return 'error'
  if (text === 'skipped' || text === 'skip')
    return 'skipped'
  return 'success'
}

export function parseStreamNodeStarted(data: unknown): FlowNodeExecution | null {
  const row = asRecord(data)
  if (!row || typeof row.nodeId !== 'string')
    return null
  return {
    nodeId: row.nodeId,
    nodeName: typeof row.nodeName === 'string' ? row.nodeName : undefined,
    nodeType: typeof row.nodeType === 'string' ? row.nodeType : undefined,
    status: 'running'
  }
}

export function parseStreamNodeFinished(data: unknown): FlowNodeExecution | null {
  const row = asRecord(data)
  if (!row || typeof row.nodeId !== 'string')
    return null
  const output = asRecord(row.output) ?? undefined
  return {
    nodeId: row.nodeId,
    nodeName: typeof row.nodeName === 'string' ? row.nodeName : undefined,
    nodeType: typeof row.nodeType === 'string' ? row.nodeType : undefined,
    status: normalizeExecutionStatus(row.status),
    durationMs: typeof row.durationMs === 'number' ? row.durationMs : undefined,
    output,
    error: typeof row.error === 'string' ? row.error : undefined
  }
}

export function parseNodeExecutions(payload: unknown): FlowNodeExecution[] {
  const root = asRecord(payload)
  if (!root)
    return []

  const list = root.nodeExecutions
  if (!Array.isArray(list))
    return []

  const executions: FlowNodeExecution[] = []
  for (const item of list) {
    const row = asRecord(item)
    if (!row || typeof row.nodeId !== 'string')
      continue
    const output = asRecord(row.output) ?? undefined
    executions.push({
      nodeId: row.nodeId,
      nodeName: typeof row.nodeName === 'string' ? row.nodeName : undefined,
      nodeType: typeof row.nodeType === 'string' ? row.nodeType : undefined,
      status: normalizeExecutionStatus(row.status),
      durationMs: typeof row.durationMs === 'number' ? row.durationMs : undefined,
      output,
      error: typeof row.error === 'string' ? row.error : undefined
    })
  }
  return executions
}

export function parseFlowRunSummary(payload: unknown): FlowRunSummary {
  const root = asRecord(payload)
  if (!root)
    return {}

  return {
    status: typeof root.status === 'string' ? root.status : undefined,
    message: typeof root.message === 'string' ? root.message : undefined,
    methodKey: typeof root.methodKey === 'string' ? root.methodKey : undefined,
    apiOutput: asRecord(root.apiOutput) ?? undefined,
    endNodeOutput: asRecord(root.endNodeOutput) ?? undefined,
    lastNodeOutput: asRecord(root.lastNodeOutput) ?? undefined
  }
}

export function isFlowRunFailed(summary: FlowRunSummary): boolean {
  const status = (summary.status ?? '').toUpperCase()
  return status === 'FINISHED_ABNORMAL' || status === 'ERROR'
}
