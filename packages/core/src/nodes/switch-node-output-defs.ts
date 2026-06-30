import type { Parameter } from '@tinyflow-ai/ui'

export const switchNodeOutputDefs: Parameter[] = [
  {
    name: 'matched',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '是否命中某个 case（否则走默认分支）'
  },
  {
    name: 'branch',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '实际走向的分支 id（case id 或 else）'
  },
  {
    name: 'switchValue',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '用于匹配的分支变量取值'
  }
]
