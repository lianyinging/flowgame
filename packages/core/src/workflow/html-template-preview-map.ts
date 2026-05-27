import type { FlowParameter } from '../inspector/node-inspector-config'

/** 根据入参生成预览占位数据（执行前模拟 {{ 参数名 }} 替换） */
export function buildHtmlTemplatePreviewMap(parameters: FlowParameter[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const p of parameters) {
    const name = (p.name || '').trim()
    if (!name)
      continue
    if (p.refType === 'fixed') {
      const v = p.value
      map[name] = v == null || v === '' ? `[${name}]` : String(v)
    }
    else {
      map[name] = `[${name}]`
    }
  }
  return map
}

export function mergeHtmlTemplatePreviewMap(
  parameters: FlowParameter[],
  previous?: Record<string, string> | null
): Record<string, string> {
  const defaults = buildHtmlTemplatePreviewMap(parameters)
  if (!previous)
    return defaults
  const next = { ...defaults }
  for (const key of Object.keys(previous)) {
    if (key in defaults)
      next[key] = previous[key]!
  }
  return next
}
