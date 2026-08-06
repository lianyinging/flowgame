import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/** 用户消息：可引用上游变量，执行时与「用户提示词」模板合并 */
export const llmApiUserMessageParameter: Parameter = {
  id: 'llmapi_user_message',
  name: 'userMessage',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '用户侧输入；引用上游节点输出，或在节点配置中填写用户提示词作为模板'
}

/**
 * 可选入参：在「模型厂家」填 {{modelProvider}} 时，执行会用此入参的值替换。
 * 默认引用上游；也可改固定值。
 */
export const llmApiModelProviderParameter: Parameter = {
  id: newParameterId('llmapi_provider'),
  name: 'modelProvider',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '供字段 {{modelProvider}} 替换；可引用上游或改固定值'
}

export const llmApiModelNameParameter: Parameter = {
  id: newParameterId('llmapi_model'),
  name: 'modelName',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '供字段 {{modelName}} 替换；可引用上游或改固定值'
}

export const llmApiApiKeyParameter: Parameter = {
  id: newParameterId('llmapi_api_key'),
  name: 'apiKey',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '供字段 {{apiKey}} 替换；可引用上游或改固定值'
}

export const LLMAPI_BINDABLE_PARAM_NAMES = [
  'modelProvider',
  'modelName',
  'apiKey',
  'userMessage'
] as const

export type LlmApiBindableParamName = (typeof LLMAPI_BINDABLE_PARAM_NAMES)[number]

export const llmApiNodeDefaultParameters: Parameter[] = [
  llmApiModelProviderParameter,
  llmApiModelNameParameter,
  llmApiApiKeyParameter,
  llmApiUserMessageParameter
]

export function createLlmApiBindableParameter(
  name: Exclude<LlmApiBindableParamName, 'userMessage'>,
  value = ''
): Parameter {
  if (name === 'modelProvider') {
    return {
      ...llmApiModelProviderParameter,
      id: newParameterId('llmapi_provider'),
      value: '',
      ref: '',
      defaultValue: value || ''
    }
  }
  if (name === 'modelName') {
    return {
      ...llmApiModelNameParameter,
      id: newParameterId('llmapi_model'),
      value: '',
      ref: '',
      defaultValue: value || ''
    }
  }
  return {
    ...llmApiApiKeyParameter,
    id: newParameterId('llmapi_api_key'),
    value: '',
    ref: '',
    defaultValue: value || ''
  }
}
