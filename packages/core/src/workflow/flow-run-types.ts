/** 试运行弹窗：单节点执行记录（与后端 nodeExecutions 对齐） */
export interface FlowNodeExecution {
  nodeId: string
  nodeName?: string
  nodeType?: string
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  durationMs?: number
  output?: Record<string, unknown>
  error?: string
}

export interface FlowRunPlanNode {
  id: string
  type?: string
  label: string
}

export type FlowRunPhase = 'running' | 'success' | 'error'

export interface FlowRunSummary {
  status?: string
  message?: string
  methodKey?: string
  apiOutput?: Record<string, unknown>
  endNodeOutput?: Record<string, unknown>
  lastNodeOutput?: Record<string, unknown>
}

export interface FlowRunViewState {
  phase: FlowRunPhase
  plan: FlowRunPlanNode[]
  executions: FlowNodeExecution[]
  summary: FlowRunSummary | null
}
