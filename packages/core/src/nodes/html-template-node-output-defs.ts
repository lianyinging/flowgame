import type { Parameter } from '@tinyflow-ai/ui'

export const htmlTemplateNodeOutputDefs: Parameter[] = [
  {
    name: 'html',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '根据模板与入参渲染后的 HTML 字符串'
  }
]
