/** 默认模型厂家 */
export const DEFAULT_LLMAPI_PROVIDER = 'deepseek'

/** 模型调用节点默认模型名称（DeepSeek） */
export const DEFAULT_LLMAPI_MODEL_NAME = 'deepseek-v4-flash'

/**
 * @deprecated 已改为按厂家解析地址；保留常量仅兼容旧引用
 */
export const DEFAULT_LLMAPI_MODEL_API_URL = 'https://api.deepseek.com/chat/completions'

export const LLMAPI_PROVIDER_OPTIONS = [
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: '通义千问', value: 'qwen' },
  { label: '月之暗面 Kimi', value: 'moonshot' },
  { label: '智谱 GLM', value: 'zhipu' }
] as const

/** 各厂家可选模型（画布 / 侧栏联动） */
export const LLMAPI_MODELS_BY_PROVIDER: Record<string, { label: string, value: string }[]> = {
  deepseek: [
    { label: 'deepseek-v4-flash', value: 'deepseek-v4-flash' },
    { label: 'deepseek-chat', value: 'deepseek-chat' },
    { label: 'deepseek-reasoner', value: 'deepseek-reasoner' }
  ],
  openai: [
    { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
    { label: 'gpt-4o', value: 'gpt-4o' },
    { label: 'gpt-4.1-mini', value: 'gpt-4.1-mini' },
    { label: 'o4-mini', value: 'o4-mini' }
  ],
  qwen: [
    { label: 'qwen-plus', value: 'qwen-plus' },
    { label: 'qwen-turbo', value: 'qwen-turbo' },
    { label: 'qwen-max', value: 'qwen-max' },
    { label: 'qwen-long', value: 'qwen-long' }
  ],
  moonshot: [
    { label: 'moonshot-v1-8k', value: 'moonshot-v1-8k' },
    { label: 'moonshot-v1-32k', value: 'moonshot-v1-32k' },
    { label: 'moonshot-v1-128k', value: 'moonshot-v1-128k' }
  ],
  zhipu: [
    { label: 'glm-4-flash', value: 'glm-4-flash' },
    { label: 'glm-4-air', value: 'glm-4-air' },
    { label: 'glm-4-plus', value: 'glm-4-plus' }
  ]
}

export const LLMAPI_PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  deepseek: 'deepseek-v4-flash',
  openai: 'gpt-4o-mini',
  qwen: 'qwen-plus',
  moonshot: 'moonshot-v1-8k',
  zhipu: 'glm-4-flash'
}

/** 是否为 {{ param }} 模板（可在厂家/模型/Key 中手填，执行时用入参替换） */
export function isLlmApiTemplateValue(value: unknown): boolean {
  return /\{\{\s*[\w.]+\s*\}\}/.test(String(value || ''))
}

export function normalizeLlmApiProvider(provider: unknown): string {
  const text = String(provider || '').trim()
  if (!text)
    return DEFAULT_LLMAPI_PROVIDER
  if (isLlmApiTemplateValue(text))
    return text
  const key = text.toLowerCase()
  if (key in LLMAPI_MODELS_BY_PROVIDER)
    return key
  // 允许非预置厂家字符串（例如上游传入的自定义值），原样保留
  return text
}

export function getLlmApiModelOptions(provider: unknown): { label: string, value: string }[] {
  const raw = String(provider || '').trim()
  if (isLlmApiTemplateValue(raw))
    return Object.values(LLMAPI_MODELS_BY_PROVIDER).flat()
  const key = raw.toLowerCase()
  if (key in LLMAPI_MODELS_BY_PROVIDER)
    return LLMAPI_MODELS_BY_PROVIDER[key]
  return LLMAPI_MODELS_BY_PROVIDER[DEFAULT_LLMAPI_PROVIDER]
}

/** 切换厂家时：模板串原样保留；否则当前模型仍属该厂家则保留，否则回落默认 */
export function resolveLlmApiModelForProvider(provider: unknown, modelName: unknown): string {
  const current = String(modelName || '').trim()
  if (isLlmApiTemplateValue(current))
    return current
  if (isLlmApiTemplateValue(provider))
    return current || DEFAULT_LLMAPI_MODEL_NAME
  const key = normalizeLlmApiProvider(provider)
  const options = getLlmApiModelOptions(key)
  if (current && options.some(o => o.value === current))
    return current
  if (current && !(key in LLMAPI_MODELS_BY_PROVIDER))
    return current
  return LLMAPI_PROVIDER_DEFAULT_MODEL[key] || DEFAULT_LLMAPI_MODEL_NAME
}

/** @deprecated 使用 getLlmApiModelOptions */
export const LLMAPI_MODEL_OPTIONS = Object.values(LLMAPI_MODELS_BY_PROVIDER).flat()

/** 从旧 modelApiUrl 推断厂家 */
export function inferLlmApiProviderFromUrl(url: string): string {
  const text = (url || '').trim().toLowerCase()
  if (!text)
    return DEFAULT_LLMAPI_PROVIDER
  if (text.includes('deepseek'))
    return 'deepseek'
  if (text.includes('openai.com'))
    return 'openai'
  if (text.includes('dashscope') || text.includes('aliyuncs.com'))
    return 'qwen'
  if (text.includes('moonshot'))
    return 'moonshot'
  if (text.includes('bigmodel') || text.includes('zhipu'))
    return 'zhipu'
  return DEFAULT_LLMAPI_PROVIDER
}
