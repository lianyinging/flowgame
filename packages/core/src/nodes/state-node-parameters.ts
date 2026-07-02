import type { Parameter } from '@tinyflow-ai/ui'

export const stateEntityKeyParameter: Parameter = {
  id: 'state_entity_key',
  name: 'entityKey',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  required: true,
  description: '实体标识，与 Key 模板 {{entityKey}} 对应（可改为 taskId 等参数名）'
}

export const stateStatusParameter: Parameter = {
  id: 'state_status',
  name: 'status',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'fixed',
  value: 'pending',
  description: '主状态码，如 pending / running / done / failed'
}

export const stateProgressParameter: Parameter = {
  id: 'state_progress',
  name: 'progress',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'Number',
  refType: 'fixed',
  value: '',
  description: '进度 0–100（可选）'
}

export const stateMessageParameter: Parameter = {
  id: 'state_message',
  name: 'message',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'fixed',
  value: '',
  description: '人类可读说明（可选）'
}

export const statePayloadParameter: Parameter = {
  id: 'state_payload',
  name: 'payload',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'Object',
  refType: 'ref',
  description: '扩展 JSON 对象（可选）；update 模式与已有 payload 深合并'
}

/** 写入模式默认入参 */
export const stateMachineWriteParameters: Parameter[] = [
  stateEntityKeyParameter,
  stateStatusParameter,
  stateProgressParameter,
  stateMessageParameter,
  statePayloadParameter
]

/** 读取 / 删除：仅实体 Key */
export const stateMachineReadParameters: Parameter[] = [
  stateEntityKeyParameter
]

/** 更新模式：字段均可选（至少传一项业务字段） */
export const stateMachineUpdateParameters: Parameter[] = [
  stateEntityKeyParameter,
  { ...stateStatusParameter, value: '', required: false },
  { ...stateProgressParameter, required: false },
  { ...stateMessageParameter, required: false },
  statePayloadParameter
]

export const DEFAULT_STATE_KEY_TEMPLATE = '{{entityKey}}'
export const DEFAULT_STATE_NAMESPACE = 'default'
export const DEFAULT_STATE_EXPIRE_SECONDS = '86400'
