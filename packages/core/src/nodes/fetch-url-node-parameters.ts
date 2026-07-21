import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

export const fetchUrlParameter: Parameter = {
  id: newParameterId('fetch_url'),
  name: 'url',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '要抓取的页面 URL；可引用上游搜索结果的 url'
}

export const fetchUrlNodeDefaultParameters: Parameter[] = [fetchUrlParameter]
