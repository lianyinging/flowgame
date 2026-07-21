import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/** 与 WebSearchNode.execute 返回字段对齐 */
export const webSearchNodeOutputDefs: Parameter[] = [
  {
    id: newParameterId('out'),
    name: 'documents',
    dataType: 'Array',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '搜索结果列表（title / content / url / engine）'
  },
  {
    id: newParameterId('out'),
    name: 'title',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首条结果标题'
  },
  {
    id: newParameterId('out'),
    name: 'content',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首条结果摘要'
  },
  {
    id: newParameterId('out'),
    name: 'url',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首条结果链接'
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
