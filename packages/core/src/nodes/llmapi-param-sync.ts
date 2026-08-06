import {
  isLlmApiTemplateValue,
  normalizeLlmApiProvider,
  resolveLlmApiModelForProvider
} from './llmapi-providers'

/**
 * 厂家/模型字段变更：支持下拉固定值，或手填 {{modelProvider}} / {{modelName}}。
 * 不再回写输入参数（入参供模板替换，与字段解耦）。
 */
export function buildLlmApiProviderModelPatch(
  _data: Record<string, unknown>,
  payload: { modelProvider: string, modelName: string }
): Record<string, unknown> {
  let modelProvider = String(payload.modelProvider ?? '').trim()
  let modelName = String(payload.modelName ?? '').trim()

  if (!isLlmApiTemplateValue(modelProvider))
    modelProvider = normalizeLlmApiProvider(modelProvider)

  if (isLlmApiTemplateValue(modelName)) {
    // keep
  }
  else if (isLlmApiTemplateValue(modelProvider)) {
    modelName = modelName || ''
  }
  else {
    modelName = resolveLlmApiModelForProvider(modelProvider, modelName)
  }

  return { modelProvider, modelName }
}

/** API Key 字段：支持明文或 {{apiKey}} */
export function buildLlmApiApiKeyPatch(
  _data: Record<string, unknown>,
  apiKey: string
): Record<string, unknown> {
  return { apiKey: String(apiKey ?? '') }
}
