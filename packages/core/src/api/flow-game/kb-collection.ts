/**
 * FlowGame 知识库 Collection 命名（与 flowgame_python kb_collection 一致）
 * 物理名：{prefix}{base}_qa | {prefix}{base}_doc（base 支持中文，如 日常问题）
 * 界面仅展示 base 短名，不展示前缀与 _qa/_doc 后缀
 */

import { getQdrantKbPrefix } from './key-prefix'

export const KB_QA_SUFFIX = '_qa'
export const KB_DOC_SUFFIX = '_doc'
export const KB_COLLECTION_TYPE_QA = 'qa'
export const KB_COLLECTION_TYPE_DOC = 'document'

/** 知识库短名（展示名） */
export const KB_BASE_NAME_PATTERN = /^[\u4e00-\u9fffA-Za-z0-9][\u4e00-\u9fffA-Za-z0-9_-]*$/

export interface KbBaseItem {
  baseName: string
  qaCollection: string
  docCollection: string
  qaPointsCount?: number
  docPointsCount?: number
  status?: string
}

export function stripFlowgamePrefix(name: string) {
  const prefix = getQdrantKbPrefix()
  const value = (name || '').trim()
  return value.startsWith(prefix)
    ? value.slice(prefix.length).trim()
    : value
}

export function normalizeKbBaseName(name: string) {
  const prefix = getQdrantKbPrefix()
  let value = (name || '').trim()
  if (!value)
    throw new Error('知识库名称不能为空')
  if (value.endsWith(KB_QA_SUFFIX))
    value = value.slice(0, -KB_QA_SUFFIX.length)
  else if (value.endsWith(KB_DOC_SUFFIX))
    value = value.slice(0, -KB_DOC_SUFFIX.length)
  value = stripFlowgamePrefix(value).trim()
  if (!value)
    throw new Error('知识库名称无效')
  if (value.startsWith(prefix))
    throw new Error(`请勿重复包含知识库前缀「${prefix}」`)
  if (!KB_BASE_NAME_PATTERN.test(value))
    throw new Error('知识库名称须以中文、字母或数字开头，可含下划线、连字符')
  return value
}

/** 界面展示：去掉前缀与 _qa/_doc */
export function displayKbBaseName(name: string) {
  try {
    return normalizeKbBaseName(name)
  }
  catch {
    return (name || '').trim()
  }
}

/** 知识库下拉选项：按 baseName 去重，可选保留当前已选（不在列表中时） */
export function buildKbBaseSelectOptions(
  bases: KbBaseItem[],
  extraSelected?: string
): Array<{ value: string, label: string }> {
  const seen = new Set<string>()
  const out: Array<{ value: string, label: string }> = []

  const push = (raw: string) => {
    const base = displayKbBaseName(raw)
    if (!base || seen.has(base))
      return
    seen.add(base)
    out.push({ value: base, label: base })
  }

  if (extraSelected)
    push(extraSelected)
  for (const item of bases) {
    if (item.baseName)
      push(item.baseName)
  }
  return out
}

export function toQaCollectionName(baseName: string) {
  return `${getQdrantKbPrefix()}${normalizeKbBaseName(baseName)}${KB_QA_SUFFIX}`
}

export function toDocCollectionName(baseName: string) {
  return `${getQdrantKbPrefix()}${normalizeKbBaseName(baseName)}${KB_DOC_SUFFIX}`
}

export function isFlowgameKbCollection(name: string) {
  const prefix = getQdrantKbPrefix()
  const n = (name || '').trim()
  return n.startsWith(prefix) && (n.endsWith(KB_QA_SUFFIX) || n.endsWith(KB_DOC_SUFFIX))
}

export function isQaCollectionName(name: string) {
  const prefix = getQdrantKbPrefix()
  const n = (name || '').trim()
  return n.startsWith(prefix) && n.endsWith(KB_QA_SUFFIX)
}

export function isDocCollectionName(name: string) {
  const prefix = getQdrantKbPrefix()
  const n = (name || '').trim()
  return n.startsWith(prefix) && n.endsWith(KB_DOC_SUFFIX)
}

export function collectionTypeOf(name: string): 'qa' | 'document' | null {
  if (isQaCollectionName(name))
    return KB_COLLECTION_TYPE_QA
  if (isDocCollectionName(name))
    return KB_COLLECTION_TYPE_DOC
  return null
}

export function isKbBaseNameInput(name: string) {
  try {
    normalizeKbBaseName(name)
    return true
  }
  catch {
    return false
  }
}
