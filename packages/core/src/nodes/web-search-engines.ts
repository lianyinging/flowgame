/** 可勾选的搜索引擎（value 与后端 engine id 一致） */
export interface WebSearchEngineOption {
  value: string
  label: string
  description?: string
}

/** 网页搜索节点可选引擎：仅腾讯新闻（Playwright） */
export const WEB_SEARCH_ENGINE_OPTIONS: WebSearchEngineOption[] = [
  {
    value: 'qq_news',
    label: '腾讯新闻',
    description: 'Playwright 渠道；本地需 playwright install chromium（Docker 已内置）'
  }
]

/** 默认勾选：腾讯新闻 */
export const DEFAULT_WEB_SEARCH_ENGINES = ['qq_news'] as const

/** 历史引擎 id（付费或已下架），加载旧流程时忽略并回退到默认 */
const LEGACY_ENGINES = new Set([
  'tavily',
  'bing',
  'google_news',
  'duckduckgo',
  'wikipedia',
  'sina_news'
])

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
        .filter(id => !LEGACY_ENGINES.has(id))
        .filter(id => allowed.has(id))
    )
  ]
  return unique.length ? unique : [...DEFAULT_WEB_SEARCH_ENGINES]
}
