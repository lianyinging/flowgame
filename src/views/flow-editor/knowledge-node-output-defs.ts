import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from './node-inspector-config'

/** 与 KnowledgeNode.execute 返回字段对齐，供变量树引用 */
export function createKnowledgeNodeDefaultOutputDefs(): Parameter[] {
  return [
    {
      id: newParameterId('out'),
      name: 'documents',
      dataType: 'Array',
      nameDisabled: true,
      deleteDisabled: true
    },
    {
      id: newParameterId('out'),
      name: 'content',
      dataType: 'String',
      nameDisabled: true,
      deleteDisabled: true
    },
    {
      id: newParameterId('out'),
      name: 'title',
      dataType: 'String',
      nameDisabled: true,
      deleteDisabled: true
    },
    {
      id: newParameterId('out'),
      name: 'answer',
      dataType: 'String',
      nameDisabled: true,
      deleteDisabled: true
    },
    {
      id: newParameterId('out'),
      name: 'question',
      dataType: 'String',
      nameDisabled: true,
      deleteDisabled: true
    },
    {
      id: newParameterId('out'),
      name: 'documentId',
      dataType: 'Number',
      nameDisabled: true,
      deleteDisabled: true
    },
    {
      id: newParameterId('out'),
      name: 'knowledgeId',
      dataType: 'String',
      nameDisabled: true,
      deleteDisabled: true
    }
  ]
}
