import type { Parameter } from '@tinyflow-ai/ui'

export const databaseNodeOutputDefs: Parameter[] = [
  {
    name: 'data',
    nameDisabled: true,
    dataType: 'Array',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '查询结果 JSON 数组（每行一个对象）；写操作时为 []'
  },
  {
    name: 'rowCount',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: 'SELECT 返回行数，或 INSERT/UPDATE/DELETE 影响行数'
  },
  {
    name: 'success',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'errorMessage',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  }
]
