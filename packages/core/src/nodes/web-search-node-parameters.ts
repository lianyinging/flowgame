import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

export const webSearchKeywordParameter: Parameter = {
  id: newParameterId('web_search_keyword'),
  name: 'keyword',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '搜索关键字；可引用上游变量或填固定值'
}

export const webSearchLimitParameter: Parameter = {
  id: newParameterId('web_search_limit'),
  name: 'limit',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'Number',
  refType: 'fixed',
  value: '10',
  defaultValue: '10',
  description: '返回条数，默认 10，最大 50'
}

export const webSearchNodeDefaultParameters: Parameter[] = [
  webSearchLimitParameter,
  webSearchKeywordParameter
]
