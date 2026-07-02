import type { Parameter } from '@tinyflow-ai/ui'

export const stateMachineNodeOutputDefs: Parameter[] = [
  {
    name: 'success',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'exists',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'deleted',
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
    name: 'state',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'previousState',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'lastState',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'status',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'progress',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'message',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'payload',
    nameDisabled: true,
    dataType: 'Object',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'ttlSeconds',
    nameDisabled: true,
    dataType: 'Number',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'changedFields',
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
