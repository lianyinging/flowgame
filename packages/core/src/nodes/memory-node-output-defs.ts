import type { Parameter } from '@tinyflow-ai/ui'

export const memoryWriteNodeOutputDefs: Parameter[] = [
  {
    name: 'success',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'redisKey',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'listLength',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'writtenCount',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'writes',
    nameDisabled: true,
    dataType: 'Array',
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

export const memoryReadNodeOutputDefs: Parameter[] = [
  {
    name: 'items',
    nameDisabled: true,
    dataType: 'Array',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'redisKey',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'count',
    nameDisabled: true,
    dataType: 'Number',
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
