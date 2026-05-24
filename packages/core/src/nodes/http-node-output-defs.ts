import type { Parameter } from '@tinyflow-ai/ui'

/** 与 Tinyflow 内置 httpNode 默认输出参数一致 */
export const httpNodeOutputDefs: Parameter[] = [
  {
    name: 'headers',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'body',
    nameDisabled: true,
    dataType: 'String',
    deleteDisabled: true
  },
  {
    name: 'statusCode',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true
  }
]
