/** 与 smartAi flowgame.chain.template.format_template 对齐 */

const PLACEHOLDER = /\{\{\s*(.+?)\s*}}/g

function getByPath(root: Record<string, unknown>, path: string): unknown {
  if (!path)
    return undefined
  const parts = path.split('.')
  let current: unknown = root
  for (const part of parts) {
    if (current == null || typeof current !== 'object')
      return undefined
    current = (current as Record<string, unknown>)[part]
    if (current === undefined)
      return undefined
  }
  return current
}

export function formatHtmlTemplate(
  template: string | null | undefined,
  rootMap?: Record<string, unknown> | null
): string {
  if (!template)
    return ''
  const root = rootMap ?? {}

  return template.replace(PLACEHOLDER, (_match, content: string) => {
    const parts = content.split(/\s*\?\?\s*/)
    const expr = parts[0].trim()
    let defaultVal = ''
    if (parts.length === 2) {
      let defaultRaw = parts[1].trim()
      if (
        (defaultRaw.startsWith('\'') && defaultRaw.endsWith('\''))
        || (defaultRaw.startsWith('"') && defaultRaw.endsWith('"'))
      ) {
        defaultVal = defaultRaw.slice(1, -1)
      }
      else {
        defaultVal = defaultRaw
      }
    }
    const value = getByPath(root, expr)
    if (value == null)
      return defaultVal
    return String(value)
  })
}
