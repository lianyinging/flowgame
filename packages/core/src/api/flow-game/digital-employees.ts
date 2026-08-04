/**
 * 数字员工 API
 * /api/v1/flowGame/digital-employees*
 */
import flowgameRequest, { type FlowgameApiResponse } from '../client'
import type { SessionRobotBindType } from './robots'

export interface DigitalEmployee {
  employeeId: string
  name: string
  description?: string
  /** 可选：决策流程 methodKey */
  decisionMethodKey?: string
  /** flow=任务目标绑流程；team=绑 AgentTeam */
  bindType?: SessionRobotBindType
  methodKey?: string
  teamKey?: string
  executeTimeoutSec?: number | null
  bound?: boolean
  bindLabel?: string
  createdAt?: string
  updatedAt?: string
}

export interface DigitalEmployeeDefaults {
  bindTypes: { value: SessionRobotBindType, label: string }[]
  defaultExecuteTimeoutSec?: number
  defaultTeamExecuteTimeoutSec?: number
}

function unwrap<T>(res: FlowgameApiResponse<T>, fallbackMsg: string): T {
  if (res.code !== 200)
    throw new Error(res.msg || res.message || fallbackMsg)
  return res.data as T
}

export async function getDigitalEmployeeDefaultsApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<DigitalEmployeeDefaults>>(
    '/v1/flowGame/digital-employees/defaults'
  )
  return unwrap(res, '获取数字员工默认配置失败')
}

export async function listDigitalEmployeesApi() {
  const res = await flowgameRequest.get<FlowgameApiResponse<{
    items: DigitalEmployee[]
    total: number
  }>>('/v1/flowGame/digital-employees')
  return unwrap(res, '列出数字员工失败')
}

export async function saveDigitalEmployeeApi(
  employee: Partial<DigitalEmployee> & { name: string }
) {
  const res = await flowgameRequest.put<FlowgameApiResponse<DigitalEmployee>>(
    '/v1/flowGame/digital-employees',
    employee
  )
  return unwrap(res, '保存数字员工失败')
}

export async function deleteDigitalEmployeeApi(employeeId: string) {
  const res = await flowgameRequest.delete<FlowgameApiResponse<{ deleted: boolean }>>(
    `/v1/flowGame/digital-employees/${encodeURIComponent(employeeId)}`
  )
  return unwrap(res, '删除数字员工失败')
}
