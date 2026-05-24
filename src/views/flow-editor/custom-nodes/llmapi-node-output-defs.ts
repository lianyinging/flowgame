import type { Parameter } from '@tinyflow-ai/ui'

/** 模型调用节点默认输出（与运行时 HTTP 响应字段对应） */
export const llmApiNodeOutputDefs: Parameter[] = [
  {
    name: 'output',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '模型返回的文本内容'
  },
  {
    name: 'rawResponse',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '接口原始 JSON 响应'
  },
  {
    name: 'errorMessage',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '请求失败时的错误信息'
  }
]
