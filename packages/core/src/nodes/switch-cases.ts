export interface SwitchCaseDef {
  id: string
  value: string
  label?: string
}

export const SWITCH_ELSE_CASE_ID = 'else'
export const DEFAULT_SWITCH_PARAM = 'value'

/** 从 `msg` 或 `{{ msg }}` 解析输入参数名 */
export function parseSwitchParamRef(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed)
    return ''
  const match = trimmed.match(/^\{\{\s*(.+?)\s*}}$/)
  if (match)
    return match[1].trim()
  return trimmed
}

export function formatSwitchParamRef(paramName: string): string {
  const name = paramName.trim()
  if (!name)
    return ''
  if (/^\{\{[\s\S]+\}\}$/.test(name))
    return name
  return `{{${name}}}`
}

export function createSwitchCaseId(index: number) {
  return `case-${index}`
}

export function defaultSwitchCases(): SwitchCaseDef[] {
  return [
    { id: createSwitchCaseId(0), value: 'success', label: '成功' },
    { id: createSwitchCaseId(1), value: 'failed', label: '失败' }
  ]
}

function normalizeCaseItem(raw: unknown, index: number): SwitchCaseDef | null {
  if (!raw || typeof raw !== 'object')
    return null
  const item = raw as Record<string, unknown>
  const id = typeof item.id === 'string' && item.id.trim()
    ? item.id.trim()
    : createSwitchCaseId(index)
  const value = typeof item.value === 'string' ? item.value : String(item.value ?? '')
  const label = typeof item.label === 'string' ? item.label : undefined
  return { id, value, label }
}

export function parseSwitchCases(data: Record<string, unknown> | undefined): SwitchCaseDef[] {
  const raw = data?.cases
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((item, index) => normalizeCaseItem(item, index))
      .filter((item): item is SwitchCaseDef => Boolean(item))
  }
  return defaultSwitchCases()
}

export function readSwitchParamName(data: Record<string, unknown> | undefined) {
  const key = data?.switchKey
  if (typeof key === 'string' && key.trim())
    return parseSwitchParamRef(key) || DEFAULT_SWITCH_PARAM
  return DEFAULT_SWITCH_PARAM
}

export function switchCaseSelectLabel(caseDef: SwitchCaseDef) {
  const label = caseDef.label?.trim()
  if (label)
    return `${label}（${caseDef.value}）`
  return `等于 ${caseDef.value}`
}

export function appendSwitchCase(cases: SwitchCaseDef[]): SwitchCaseDef[] {
  return [
    ...cases,
    { id: createSwitchCaseId(cases.length), value: '', label: '' }
  ]
}

export function removeSwitchCase(cases: SwitchCaseDef[], caseId: string): SwitchCaseDef[] {
  if (cases.length <= 1)
    return cases
  return cases.filter(c => c.id !== caseId)
}
