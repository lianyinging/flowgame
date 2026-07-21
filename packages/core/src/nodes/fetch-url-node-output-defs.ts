import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

export const fetchUrlNodeOutputDefs: Parameter[] = [
  {
    id: newParameterId('out'),
    name: 'title',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    id: newParameterId('out'),
    name: 'content',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '抽取后的正文文本'
  },
  {
    id: newParameterId('out'),
    name: 'url',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    id: newParameterId('out'),
    name: 'statusCode',
    dataType: 'Number',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    id: newParameterId('out'),
    name: 'contentType',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    id: newParameterId('out'),
    name: 'fetchMethod',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: 'jina 或 requests+strip'
  },
  {
    id: newParameterId('out'),
    name: 'errorMessage',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  }
]
