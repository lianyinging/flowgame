import type { Parameter } from '@tinyflow-ai/ui'

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

export const llmApiNodeDefaultParameters: Parameter[] = [
  llmApiUserMessageParameter
]
