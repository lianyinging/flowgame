export const CODE_NODE_TYPE = 'codeNode'

/** 与 Tinyflow 内置 codeNode 一致 */
export const CODE_NODE_ENGINE_OPTIONS = [
  { label: 'JavaScript', value: 'js' },
  { label: 'Groovy', value: 'groovy' },
  { label: 'QLExpress', value: 'qlexpress' }
] as const

export const DEFAULT_CODE_NODE_ENGINE = 'qlexpress'

export const CODE_NODE_CODE_PLACEHOLDER =
  '请输入执行代码，注：输出内容需添加到_result中，如：_result[\'key\'] = value 或者 _result.key = value'

export function isCodeNodeType(type?: string): boolean {
  return type === CODE_NODE_TYPE
}

export function readCodeNodeEngine(data: Record<string, unknown>): string {
  const engine = data.engine
  if (typeof engine === 'string' && engine.trim())
    return engine.trim()
  return DEFAULT_CODE_NODE_ENGINE
}

export function readCodeNodeCode(data: Record<string, unknown>): string {
  return typeof data.code === 'string' ? data.code : ''
}
