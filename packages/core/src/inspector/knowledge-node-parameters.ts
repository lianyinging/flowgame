import type { Parameter } from '@tinyflow-ai/ui'

/** 知识库检索关键字：支持引用上游变量或固定值，未命中引用时使用默认值 */
export const knowledgeKeywordParameter: Parameter = {
  id: 'knowledge_keyword',
  name: 'keyword',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '检索关键字；引用类型选上游变量，固定类型填字面量，默认值在参数更多设置中配置'
}

/** 知识库返回条数 */
export const knowledgeLimitParameter: Parameter = {
  id: 'knowledge_limit',
  name: 'limit',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'Number',
  refType: 'fixed',
  value: '10',
  defaultValue: '10',
  description: '返回条数，默认 10，最大 100'
}

export const knowledgeNodeDefaultParameters: Parameter[] = [
  knowledgeLimitParameter,
  knowledgeKeywordParameter
]
