import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/**
 * 要抓取的 URL 列表。
 * 兼容：单字符串、字符串数组、含 url/link 的对象数组（如网页搜索 documents）。
 */
export const fetchUrlsParameter: Parameter = {
  id: newParameterId('fetch_urls'),
  name: 'urls',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'Array<String>',
  refType: 'ref',
  defaultValue: '',
  description:
    '要抓取的 URL 列表；可引用上游搜索的 documents 或 url 数组；也兼容单个 url 字符串'
}

/** @deprecated 使用 fetchUrlsParameter；保留导出名避免旧引用断裂 */
export const fetchUrlParameter = fetchUrlsParameter

export const fetchUrlNodeDefaultParameters: Parameter[] = [fetchUrlsParameter]
