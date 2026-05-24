/** 流程在 Redis 中的键前缀 */
export const FLOW_LIST_REDIS_PREFIX = 'flow_game:flow_list:'

/** 旧版前缀（仅用于读取兼容） */
export const LEGACY_FLOW_LIST_REDIS_PREFIX = 'wx_base:ai:flow_list:'

/** 流程列表索引（记录已保存的流程名称） */
export const FLOW_LIST_INDEX_KEY = `${FLOW_LIST_REDIS_PREFIX}__index__`

export const LEGACY_FLOW_LIST_INDEX_KEY = `${LEGACY_FLOW_LIST_REDIS_PREFIX}__index__`

export function buildFlowRedisKey(flowName: string) {
  return `${FLOW_LIST_REDIS_PREFIX}${flowName.trim()}`
}

export function buildLegacyFlowRedisKey(flowName: string) {
  return `${LEGACY_FLOW_LIST_REDIS_PREFIX}${flowName.trim()}`
}

export function parseFlowNameFromRedisKey(redisKey: string) {
  if (redisKey.startsWith(FLOW_LIST_REDIS_PREFIX))
    return redisKey.slice(FLOW_LIST_REDIS_PREFIX.length)
  if (redisKey.startsWith(LEGACY_FLOW_LIST_REDIS_PREFIX))
    return redisKey.slice(LEGACY_FLOW_LIST_REDIS_PREFIX.length)
  return redisKey
}

/** 加载流程时依次尝试的 Redis 键（新前缀 + 旧前缀） */
export function flowRedisKeysForLoad(redisKeyOrFlowName: string) {
  const raw = redisKeyOrFlowName.trim()
  const name = parseFlowNameFromRedisKey(raw)
  const keys = [
    raw,
    buildFlowRedisKey(name),
    buildLegacyFlowRedisKey(name)
  ]
  return [...new Set(keys.filter(Boolean))]
}
