export const CODE_NODE_TYPE = 'codeNode'

/** 动态代码节点可选引擎（后端：js → mini-racer/Node；python → eval/exec） */
export const CODE_NODE_ENGINE_OPTIONS = [
  { label: 'JavaScript', value: 'js' },
  { label: 'Python', value: 'python' }
] as const

export type CodeNodeEngine = (typeof CODE_NODE_ENGINE_OPTIONS)[number]['value']

export const DEFAULT_CODE_NODE_ENGINE: CodeNodeEngine = 'js'

export const DEFAULT_CODE_NODE_CODE = `(function () {
  return {
    html: 123456
  };
})();`

export const DEFAULT_CODE_NODE_CODE_PYTHON = `result = {
  "html": 123456
}
`

export const CODE_NODE_CODE_PLACEHOLDER =
  '请输入执行代码；可用 {{code}} 引用入参脚本。JavaScript 用 IIFE 并 return 对象；Python 请赋值 result = {...}'

const LEGACY_ENGINE_MAP: Record<string, CodeNodeEngine> = {
  javascript: 'js',
  js: 'js',
  python: 'python',
  py: 'python',
  // 历史 Tinyflow 选项：统一落到 js
  groovy: 'js',
  qlexpress: 'js'
}

export function isCodeNodeType(type?: string): boolean {
  return type === CODE_NODE_TYPE
}

/** 归一化引擎值；未知/遗留选项回落为 js */
export function normalizeCodeNodeEngine(engine: unknown): CodeNodeEngine {
  if (typeof engine !== 'string' || !engine.trim())
    return DEFAULT_CODE_NODE_ENGINE
  const key = engine.trim().toLowerCase()
  return LEGACY_ENGINE_MAP[key] ?? DEFAULT_CODE_NODE_ENGINE
}

export function readCodeNodeEngine(data: Record<string, unknown>): CodeNodeEngine {
  return normalizeCodeNodeEngine(data.engine)
}

export function readCodeNodeCode(data: Record<string, unknown>): string {
  return typeof data.code === 'string' ? data.code : ''
}

export function defaultCodeForEngine(engine: CodeNodeEngine): string {
  return engine === 'python' ? DEFAULT_CODE_NODE_CODE_PYTHON : DEFAULT_CODE_NODE_CODE
}
