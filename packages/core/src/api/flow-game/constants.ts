import { getFlowListIndexKey, getFlowListRedisPrefix } from './key-prefix'

export function buildFlowRedisKey(flowName: string) {
  return `${getFlowListRedisPrefix()}${flowName.trim()}`
}

export function parseFlowNameFromRedisKey(redisKey: string) {
  const prefix = getFlowListRedisPrefix()
  if (redisKey.startsWith(prefix))
    return redisKey.slice(prefix.length)
  return redisKey
}

/** 加载流程时尝试的 Redis 键（完整键或按流程名拼接） */
export function flowRedisKeysForLoad(redisKeyOrFlowName: string) {
  const raw = redisKeyOrFlowName.trim()
  const name = parseFlowNameFromRedisKey(raw)
  const keys = [raw, buildFlowRedisKey(name)]
  return [...new Set(keys.filter(Boolean))]
}

export { getFlowListIndexKey, getFlowListRedisPrefix }
