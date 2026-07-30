import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/** 与 FetchUrlNode.execute 返回字段对齐（批量 documents + 首条便捷字段） */
export const fetchUrlNodeOutputDefs: Parameter[] = [
  {
    id: newParameterId('out'),
    name: 'documents',
    dataType: 'Array',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '抓取结果列表（title / content / url / statusCode / fetchMethod / errorMessage）'
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
    description: '首条结果正文'
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
    name: 'statusCode',
    dataType: 'Number',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首条 HTTP 状态码'
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
    description: '首条：jina 或 requests+strip'
  },
  {
    id: newParameterId('out'),
    name: 'errorMessage',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '汇总错误（多条失败时用分号拼接）'
  }
]
