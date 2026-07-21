/** 可多选的搜索引擎（仅免费、无需 API Key；value 与后端 engine id 一致） */
export interface WebSearchEngineOption {
  value: string
  label: string
  description?: string
}

/**
 * 与 demo_ai_news Scout 对齐：
 * Google News/HN RSS + DuckDuckGo；Wikipedia 可选。
 */
export const WEB_SEARCH_ENGINE_OPTIONS: WebSearchEngineOption[] = [
  {
    value: 'google_news',
    label: 'Google News / RSS',
    description: 'Google News（中/英）+ Hacker News，免费无 Key（与 demo 一致）'
  },
  {
    value: 'duckduckgo',
    label: 'DuckDuckGo',
    description: '免费网页检索，无需 API Key（与 demo 一致）'
  },
  {
    value: 'wikipedia',
    label: 'Wikipedia',
    description: '免费百科检索（MediaWiki，无需 API Key）'
  }
]

/** 默认勾选：RSS + DuckDuckGo（对齐 demo Scout） */
export const DEFAULT_WEB_SEARCH_ENGINES = ['google_news', 'duckduckgo'] as const

/** 历史付费引擎 id，加载旧流程时忽略并回退到默认免费引擎 */
const LEGACY_PAID_ENGINES = new Set(['tavily', 'bing'])

export function normalizeWebSearchEngines(raw: unknown): string[] {
  const allowed = new Set(WEB_SEARCH_ENGINE_OPTIONS.map(o => o.value))
  let list: string[] = []
  if (Array.isArray(raw)) {
    list = raw.map(v => String(v).trim().toLowerCase()).filter(Boolean)
  }
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed))
        list = parsed.map(v => String(v).trim().toLowerCase()).filter(Boolean)
      else
        list = raw.split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean)
    }
    catch {
      list = raw.split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean)
    }
  }
  const unique = [
    ...new Set(
      list
        .filter(id => !LEGACY_PAID_ENGINES.has(id))
        .filter(id => allowed.has(id))
    )
  ]
  return unique.length ? unique : [...DEFAULT_WEB_SEARCH_ENGINES]
}
