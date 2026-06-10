/** Redis 键命名空间默认前缀（与 flowgame_python 一致） */
export const DEFAULT_REDIS_KEY_PREFIX = 'flow_game:'

/** Qdrant 知识库 Collection 默认前缀 */
export const DEFAULT_QDRANT_KB_PREFIX = 'flowgame_'

let redisKeyPrefix = DEFAULT_REDIS_KEY_PREFIX
let qdrantKbPrefix = DEFAULT_QDRANT_KB_PREFIX

export function normalizeRedisKeyPrefix(raw?: string) {
  const value = (raw ?? '').trim()
  if (!value)
    return DEFAULT_REDIS_KEY_PREFIX
  return value.endsWith(':') ? value : `${value}:`
}

export function normalizeQdrantKbPrefix(raw?: string) {
  const value = (raw ?? '').trim()
  if (!value)
    return DEFAULT_QDRANT_KB_PREFIX
  return value.endsWith('_') ? value : `${value}_`
}

export function configureFlowGameKeyPrefixes(options: {
  redisKeyPrefix?: string
  qdrantKbPrefix?: string
} = {}) {
  if (options.redisKeyPrefix !== undefined)
    redisKeyPrefix = normalizeRedisKeyPrefix(options.redisKeyPrefix)
  if (options.qdrantKbPrefix !== undefined)
    qdrantKbPrefix = normalizeQdrantKbPrefix(options.qdrantKbPrefix)
}

export function getRedisKeyPrefix() {
  return redisKeyPrefix
}

export function getQdrantKbPrefix() {
  return qdrantKbPrefix
}

export function getFlowListRedisPrefix() {
  return `${redisKeyPrefix}flow_list:`
}

export function getFlowListIndexKey() {
  return `${getFlowListRedisPrefix()}__index__`
}

/** 与 flowgame_python prefix_middleware 请求头一致 */
export const FLOWGAME_REDIS_KEY_PREFIX_HEADER = 'X-Flowgame-Redis-Key-Prefix'
export const FLOWGAME_QDRANT_KB_PREFIX_HEADER = 'X-Flowgame-Qdrant-Kb-Prefix'
