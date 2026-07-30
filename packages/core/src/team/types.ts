/** 多 Agent 协同：Agent / Team 契约类型（对接后端前的前端垫层） */

export type AgentTeamStrategy = 'sequential' | 'loop_until' | 'supervisor'

export interface FlowAgentSchemaField {
  name: string
  dataType: string
  required?: boolean
  description?: string
}

/** 从已保存流程发布/配置的 Agent 元数据 */
export interface FlowAgentConfig {
  agentKey: string
  /** 对应流程 methodKey / 流程名称 */
  methodKey: string
  redisKey: string
  name: string
  description: string
  version: string
  /** 是否作为可被 Team 调用的 Agent */
  published: boolean
  timeoutMs: number
  tags: string[]
  inputSchema: FlowAgentSchemaField[]
  outputSchema: FlowAgentSchemaField[]
  updatedAt: string
}

export interface AgentTeamMember {
  agentKey: string
  alias: string
}

export interface AgentTeamHarness {
  maxSteps: number
  maxSameAgentStreak: number
  maxDecisionRetries: number
  maxTokenBudget: number
  allowedAgents: string[]
}

/** Agent Team 定义（一期配置壳） */
export interface AgentTeamDef {
  teamKey: string
  name: string
  description: string
  strategy: AgentTeamStrategy
  members: AgentTeamMember[]
  supervisorAgentKey?: string
  blackboardDefaults: Record<string, string>
  /**
   * 主控看板（status_card）投影的黑板字段名。
   * Runtime 生成 JSON：{ [key]: { empty, type, chars, itemCount?, preview } }。
   * 空数组时后端回退默认列表；黑板仍保留全部内容，卡片只投影这些键。
   */
  statusCardKeys: string[]
  harness: AgentTeamHarness
  outputPrimaryKey: string
  updatedAt: string
}

/** 主控看板默认字段（与后端 TeamRuntime.DEFAULT_STATUS_KEYS 对齐） */
export const DEFAULT_STATUS_CARD_KEYS = [
  'topic',
  'requirement',
  'target_words',
  'documents',
  'articles',
  'research',
  'outline',
  'content',
  'review',
  'article'
] as const

export const AGENT_TEAM_STRATEGY_OPTIONS: Array<{ label: string, value: AgentTeamStrategy }> = [
  { label: '固定顺序 (sequential)', value: 'sequential' },
  { label: '条件循环 (loop_until)', value: 'loop_until' },
  { label: '主控调度 (supervisor)', value: 'supervisor' }
]

export function defaultAgentTeamHarness(): AgentTeamHarness {
  return {
    maxSteps: 12,
    maxSameAgentStreak: 2,
    maxDecisionRetries: 2,
    maxTokenBudget: 200000,
    allowedAgents: []
  }
}

/** 解析逗号/换行分隔的 statusCardKeys */
export function parseStatusCardKeys(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map(v => String(v).trim()).filter(Boolean))]
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [...new Set(raw.split(/[,|\n]/).map(s => s.trim()).filter(Boolean))]
  }
  return []
}

export function normalizeStatusCardKeys(raw: unknown): string[] {
  const keys = parseStatusCardKeys(raw)
  return keys.length ? keys : [...DEFAULT_STATUS_CARD_KEYS]
}

/** 默认试运行/黑板入参键 */
export const DEFAULT_BLACKBOARD_DEFAULT_KEYS = ['topic', 'requirement', 'target_words'] as const

/**
 * 解析黑板默认值。
 * 支持：
 * - Record
 * - 多行 `key=value` / `key: value`
 * - JSON 对象字符串
 */
export function parseBlackboardDefaults(raw: unknown): Record<string, string> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const key = String(k || '').trim()
      if (!key)
        continue
      out[key] = v == null ? '' : String(v)
    }
    return out
  }
  if (typeof raw !== 'string')
    return {}
  const text = raw.trim()
  if (!text)
    return {}
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text) as unknown
      return parseBlackboardDefaults(parsed)
    }
    catch {
      // fall through to line parser
    }
  }
  const out: Record<string, string> = {}
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#'))
      continue
    const sep = trimmed.includes('=') ? '=' : (trimmed.includes(':') ? ':' : '')
    if (!sep)
      continue
    const idx = trimmed.indexOf(sep)
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!key)
      continue
    out[key] = value
  }
  return out
}

/** 格式化为编辑框多行文本 key=value */
export function formatBlackboardDefaults(defaults: Record<string, string> | null | undefined): string {
  const src = defaults || {}
  const keys = Object.keys(src)
  const ordered = [
    ...DEFAULT_BLACKBOARD_DEFAULT_KEYS.filter(k => keys.includes(k)),
    ...keys.filter(k => !(DEFAULT_BLACKBOARD_DEFAULT_KEYS as readonly string[]).includes(k)).sort()
  ]
  return ordered.map(k => `${k}=${src[k] ?? ''}`).join('\n')
}

export function createEmptyAgentConfig(partial: {
  methodKey: string
  redisKey: string
  name?: string
}): FlowAgentConfig {
  const methodKey = partial.methodKey.trim() || 'untitled'
  const name = (partial.name || methodKey).trim() || methodKey
  return {
    agentKey: methodKey,
    methodKey,
    redisKey: partial.redisKey,
    name,
    description: '',
    version: '1.0.0',
    published: false,
    timeoutMs: 120000,
    tags: [],
    inputSchema: [],
    outputSchema: [],
    updatedAt: new Date().toISOString()
  }
}

export function createEmptyAgentTeam(partial?: { name?: string }): AgentTeamDef {
  const stamp = Date.now().toString(36)
  const name = (partial?.name || '').trim() || `团队_${stamp}`
  return {
    teamKey: `team_${stamp}`,
    name,
    description: '',
    strategy: 'sequential',
    members: [],
    blackboardDefaults: {},
    statusCardKeys: [...DEFAULT_STATUS_CARD_KEYS],
    harness: defaultAgentTeamHarness(),
    outputPrimaryKey: '',
    updatedAt: new Date().toISOString()
  }
}
