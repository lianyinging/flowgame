import type { Parameter } from '@tinyflow-ai/ui'

export const joinAllNodeOutputDefs: Parameter[] = [
  {
    name: 'joined',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '是否已完成汇聚（全部分支到位且成功）'
  },
  {
    name: 'mode',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '汇聚模式：all'
  },
  {
    name: 'branchCount',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '已到达的分支数量'
  },
  {
    name: 'results',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '各上游节点输出快照（nodeId → 输出字段）'
  },
  {
    name: 'errorMessage',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  }
]

export const joinAnyNodeOutputDefs: Parameter[] = [
  {
    name: 'joined',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '是否已完成汇聚'
  },
  {
    name: 'mode',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '汇聚模式：any'
  },
  {
    name: 'branchCount',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'winnerNodeId',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首个成功分支的节点 ID'
  },
  {
    name: 'results',
    nameDisabled: true,
    dataType: 'Object',
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

export const forkNodeOutputDefs: Parameter[] = [
  {
    name: 'forked',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'branches',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '并行分支数量（出边数）'
  }
]
