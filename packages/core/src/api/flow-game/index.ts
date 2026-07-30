import request from '../client'

/** tinyflow.getData() 结构 */
export interface FlowGameWorkflow {
  nodes?: unknown[]
  edges?: unknown[]
  viewport?: Record<string, unknown>
  [key: string]: unknown
}

/** POST /siyu/flowGame/execute 管理端调试（直接传工作流） */
export interface FlowGameExecuteBody {
  workflow: FlowGameWorkflow
  variables?: Record<string, unknown>
}

/** 外部调用：按 methodKey 从 Redis 加载工作流 */
export interface FlowGameExecuteByMethodKeyBody {
  methodKey: string
  variables?: Record<string, unknown>
}

/** 兼容仅传 nodes / edges 的请求体（由后端解析） */
export type FlowGameExecuteCompatBody = FlowGameWorkflow

export type FlowGameExecutePayload = FlowGameExecuteBody | FlowGameExecuteCompatBody

export interface FlowGameNodeExecution {
  nodeId: string
  nodeName?: string
  nodeType?: string
  status: 'success' | 'error' | 'skipped' | string
  durationMs?: number
  output?: Record<string, unknown>
  error?: string
}

export interface FlowGameExecuteResult {
  status?: string
  message?: string
  methodKey?: string
  apiOutput?: Record<string, unknown>
  endNodeOutput?: Record<string, unknown>
  lastNodeOutput?: Record<string, unknown>
  nodeExecutions?: FlowGameNodeExecution[]
  [key: string]: unknown
}

/** 执行工作流（同步，整包返回） */
export function executeFlowGameApi(data: FlowGameExecutePayload) {
  return request.post<FlowGameExecuteResult>(
    '/v1/flowGame/execute',
    data,
    { timeout: 120000 }
  )
}

export { executeFlowGameStreamApi } from './execute-stream'
export type { FlowStreamEventName, FlowStreamHandlers } from './execute-stream'

export {
  deleteTeamApi,
  listTeamAgentsApi,
  listTeamsApi,
  runTeamApi,
  saveTeamAgentApi,
  saveTeamApi
} from './team'
export type { TeamRunBody, TeamRunResult, TeamRunTraceItem } from './team'
