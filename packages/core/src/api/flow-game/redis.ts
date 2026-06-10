import flowgameRequest, { type FlowgameApiResponse } from '../client'
import type { FlowGameWorkflow } from './index'
import {
  buildFlowRedisKey,
  getFlowListIndexKey,
  parseFlowNameFromRedisKey
} from './constants'

export interface RedisEntryData {
  redisKey: string
  exists: boolean
  value: unknown
  type?: string
  ttl?: number
}

export interface FlowListIndexItem {
  name: string
  redisKey: string
  updatedAt: string
}

export interface FlowListIndexData {
  items: FlowListIndexItem[]
}

const REDIS_BASE = '/v1/flowGame/redis'

export function getRedisApi(redisKey: string) {
  return flowgameRequest.get<FlowgameApiResponse<RedisEntryData>>(REDIS_BASE, { params: { redisKey } })
}

export function createRedisApi(redisKey: string, value: unknown) {
  return flowgameRequest.post<FlowgameApiResponse<RedisEntryData>>(REDIS_BASE, { redisKey, value })
}

export function updateRedisApi(redisKey: string, value: unknown) {
  return flowgameRequest.put<FlowgameApiResponse<RedisEntryData>>(REDIS_BASE, { redisKey, value })
}

export function deleteRedisApi(redisKey: string) {
  return flowgameRequest.delete<FlowgameApiResponse<{ redisKey: string; deleted: number }>>(REDIS_BASE, {
    params: { redisKey }
  })
}

async function readFlowListIndexAt(key: string): Promise<FlowListIndexData | null> {
  try {
    const res = await getRedisApi(key)
    const value = res.data?.value
    if (value && typeof value === 'object' && Array.isArray((value as FlowListIndexData).items))
      return value as FlowListIndexData
  }
  catch {
    // 索引不存在
  }
  return null
}

export async function getFlowListIndex(): Promise<FlowListIndexData> {
  const index = await readFlowListIndexAt(getFlowListIndexKey())
  return index ?? { items: [] }
}

async function saveFlowListIndex(data: FlowListIndexData) {
  const indexKey = getFlowListIndexKey()
  try {
    const existing = await getRedisApi(indexKey)
    if (existing.data?.exists)
      return updateRedisApi(indexKey, data)
  }
  catch {
    // ignore
  }
  return createRedisApi(indexKey, data)
}

export async function upsertFlowListIndexItem(name: string) {
  const redisKey = buildFlowRedisKey(name)
  const index = await getFlowListIndex()
  const items = index.items.filter(item => item.name !== name)
  items.unshift({
    name,
    redisKey,
    updatedAt: new Date().toISOString()
  })
  await saveFlowListIndex({ items })
}

export async function removeFlowListIndexItem(redisKey: string) {
  const index = await getFlowListIndex()
  const items = index.items.filter(item => item.redisKey !== redisKey)
  await saveFlowListIndex({ items })
}

/** 查询已保存的流程列表 */
export async function listFlowListApi(params?: { name?: string }) {
  const index = await getFlowListIndex()
  let items = [...index.items]
  if (params?.name?.trim()) {
    const keyword = params.name.trim().toLowerCase()
    items = items.filter(item => item.name.toLowerCase().includes(keyword))
  }
  return {
    items: items.map(item => ({
      ...item,
      name: item.name || parseFlowNameFromRedisKey(item.redisKey)
    })),
    total: items.length
  }
}

/** 保存流程工作流到 Redis */
export async function saveFlowWorkflowApi(flowName: string, workflow: FlowGameWorkflow) {
  const redisKey = buildFlowRedisKey(flowName)
  const payload = {
    name: flowName.trim(),
    workflow,
    updatedAt: new Date().toISOString()
  }

  const existing = await getRedisApi(redisKey)
  if (existing.data?.exists)
    await updateRedisApi(redisKey, payload)
  else
    await createRedisApi(redisKey, payload)

  await upsertFlowListIndexItem(flowName.trim())
  return { redisKey }
}

/** 删除流程 */
export async function deleteFlowApi(redisKey: string) {
  await deleteRedisApi(redisKey)
  await removeFlowListIndexItem(redisKey)
}
