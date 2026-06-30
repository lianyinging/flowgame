import type { Parameter } from '@tinyflow-ai/ui'

export const ifNodeOutputDefs: Parameter[] = [
  {
    name: 'matched',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '条件是否成立'
  },
  {
    name: 'branch',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '实际走向的分支 id（如 branch-0、else；兼容旧版 true/false）'
  }
]
