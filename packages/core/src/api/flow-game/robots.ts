/**
 * 会话机器人 API
 * /api/v1/flowGame/robots*
 */
import flowgameRequest, { type FlowgameApiResponse } from '../client'

export type SessionRobotType = 'wecom_aibot'
export type SessionRobotStatus = 'stopped' | 'running' | 'connecting' | 'error' | 'offline'

export interface RobotFieldMapping {
  source: string
  target: string
}

export interface SessionRobot {
  robotId: string
  name: string
  type: SessionRobotType
  botId: string
  secret: string
  hasSecret?: boolean
  methodKey: string
  /** 单机器人 /execute 超时（秒）；空则用环境变量 FLOWGAME_ROBOT_EXECUTE_TIMEOUT_SEC */
  executeTimeoutSec?: number | null
  inputMapping: RobotFieldMapping[]
  outputMapping: RobotFieldMapping[]
  desiredStatus?: 'stopped' | 'running'
  runtimeStatus?: SessionRobotStatus
  status: SessionRobotStatus
  statusMessage?: string
  createdAt?: string
  updatedAt?: string
}

export interface SessionRobotWorkerStatus {
  online: boolean
  presence?: Record<string, unknown> | null
  staleSec?: number
  hint?: string | null
}

export interface SessionRobotDefaults {
  types: { value: SessionRobotType, label: string }[]
  inputMapping: RobotFieldMapping[]
  outputMapping: RobotFieldMapping[]
  inboundFields: string[]
  outputTargets: { value: string, label: string }[]
  /** 全局默认执行超时（秒），来自 FLOWGAME_ROBOT_EXECUTE_TIMEOUT_SEC */
  defaultExecuteTimeoutSec?: number
}

function unwrap<T>(res: FlowgameApiResponse<T>, fallbackMsg: string): T {
  if (res.code !== 200)
    throw new Error(res.msg || res.message || fallbackMsg)
  return res.data as T
}

export async function getSessionRobotDefaultsApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<SessionRobotDefaults>>(
    '/v1/flowGame/robots/defaults'
  )
  return unwrap(res, '获取默认映射失败')
}

export async function getSessionRobotWorkerStatusApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<SessionRobotWorkerStatus>>(
    '/v1/flowGame/robots/worker'
  )
  return unwrap(res, '获取 Worker 状态失败')
}

export async function listSessionRobotsApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<{
    items: SessionRobot[]
    total: number
    worker?: SessionRobotWorkerStatus
  }>>('/v1/flowGame/robots')
  return unwrap(res, '列出机器人失败')
}

export async function saveSessionRobotApi(robot: Partial<SessionRobot> & { name: string, botId: string }) {
  const res = await flowgameRequest.put<FlowgameApiResponse<SessionRobot>>(
    '/v1/flowGame/robots',
    robot
  )
  return unwrap(res, '保存机器人失败')
}

export async function deleteSessionRobotApi(robotId: string) {
  const res = await flowgameRequest.delete<FlowgameApiResponse<{ deleted: boolean }>>(
    `/v1/flowGame/robots/${encodeURIComponent(robotId)}`
  )
  return unwrap(res, '删除机器人失败')
}

export async function startSessionRobotApi(robotId: string) {
  const res = await flowgameRequest.post<FlowgameApiResponse<SessionRobot>>(
    `/v1/flowGame/robots/${encodeURIComponent(robotId)}/start`
  )
  return unwrap(res, '启动失败')
}

export async function stopSessionRobotApi(robotId: string) {
  const res = await flowgameRequest.post<FlowgameApiResponse<SessionRobot>>(
    `/v1/flowGame/robots/${encodeURIComponent(robotId)}/stop`
  )
  return unwrap(res, '停止失败')
}
