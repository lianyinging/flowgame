/**
 * Team / Agent API（多 Agent 协同）
 * POST /api/v1/flowGame/teams/run 等
 */
import flowgameRequest, { type FlowgameApiResponse } from '../client'
import type { AgentTeamDef, FlowAgentConfig } from '../../team/types'

export interface TeamRunBody {
  teamKey?: string
  team?: AgentTeamDef
  agents?: FlowAgentConfig[]
  variables?: Record<string, unknown>
}

export interface TeamRunTraceItem {
  step?: number
  action?: string
  next_agent?: string | null
  ok?: boolean
  note?: string
  thinking?: string
  focus?: string
  raw?: string
}

export interface TeamRunResult {
  teamKey: string
  strategy: string
  status: string
  exit_reason: string
  output?: unknown
  blackboard?: Record<string, unknown>
  trace?: TeamRunTraceItem[]
}

function unwrap<T>(res: FlowgameApiResponse<T>, fallbackMsg: string): T {
  if (res.code !== 200)
    throw new Error(res.msg || res.message || fallbackMsg)
  return res.data as T
}

export async function listTeamAgentsApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<{ items: FlowAgentConfig[], total: number }>>(
    '/v1/flowGame/agents'
  )
  return unwrap(res, '列出 Agent 失败')
}

export async function saveTeamAgentApi(agent: FlowAgentConfig) {
  const res = await flowgameRequest.put<FlowgameApiResponse<FlowAgentConfig>>(
    '/v1/flowGame/agents',
    agent
  )
  return unwrap(res, '保存 Agent 失败')
}

export async function listTeamsApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<{ items: AgentTeamDef[], total: number }>>(
    '/v1/flowGame/teams'
  )
  return unwrap(res, '列出 Team 失败')
}

export async function saveTeamApi(team: AgentTeamDef) {
  const res = await flowgameRequest.put<FlowgameApiResponse<AgentTeamDef>>(
    '/v1/flowGame/teams',
    team
  )
  return unwrap(res, '保存 Team 失败')
}

export async function deleteTeamApi(teamKey: string) {
  const res = await flowgameRequest.delete<FlowgameApiResponse<{ deleted: boolean }>>(
    `/v1/flowGame/teams/${encodeURIComponent(teamKey)}`
  )
  return unwrap(res, '删除 Team 失败')
}

/** 执行 Team（可能较久，默认超时加长） */
export async function runTeamApi(body: TeamRunBody, timeoutMs = 600000) {
  const res = await flowgameRequest.post<FlowgameApiResponse<TeamRunResult>>(
    '/v1/flowGame/teams/run',
    body,
    { timeout: timeoutMs }
  )
  return unwrap(res, 'Team 执行失败')
}
