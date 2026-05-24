import type { Parameter } from '@tinyflow-ai/ui'
import { displayKbBaseName, normalizeKbBaseName } from '@/api/flow-game/kb-collection'

export const KNOWLEDGE_NODE_TYPES = new Set(['knowledgeNode', 'knowledgeNodePlus'])

export function isKnowledgeNodeType(type?: string) {
  return !!type && KNOWLEDGE_NODE_TYPES.has(type)
}

export function readKnowledgeBaseFromData(data: Record<string, unknown>) {
  const raw = String(
    data.collectionName ?? data.knowledgeId ?? data.knowledgeCollection ?? ''
  ).trim()
  if (!raw)
    return ''
  try {
    return normalizeKbBaseName(raw)
  }
  catch {
    return displayKbBaseName(raw)
  }
}

export function buildKnowledgeBasePatch(baseName: string) {
  const base = baseName.trim()
  return {
    collectionName: base,
    knowledgeId: base,
    knowledgeCollection: base
  }
}

export function findKnowledgeParam(
  parameters: Parameter[],
  name: 'keyword' | 'limit'
) {
  return parameters.find(p => p.name === name)
}

/** 读取 keyword：parameters 优先，兼容历史 data.keyword */
export function readKnowledgeKeyword(
  data: Record<string, unknown>,
  parameters: Parameter[]
) {
  const param = findKnowledgeParam(parameters, 'keyword')
  const legacy = String(data.keyword ?? '').trim()
  const paramRef = String(param?.ref ?? '').trim()
  const paramRefType = (param?.refType || 'ref') as string

  if (legacy) {
    return {
      refType: 'fixed' as const,
      ref: paramRefType === 'ref' ? paramRef : '',
      fixedValue: legacy
    }
  }

  if (paramRefType === 'fixed') {
    return {
      refType: 'fixed' as const,
      ref: '',
      fixedValue: String(param?.value ?? param?.defaultValue ?? '')
    }
  }

  return {
    refType: 'ref' as const,
    ref: paramRef,
    fixedValue: ''
  }
}

/** 输入参数区 keyword 摘要（对应画布 parameters 行） */
export function readKnowledgeKeywordParamBinding(parameters: Parameter[]) {
  const param = findKnowledgeParam(parameters, 'keyword')
  if (!param)
    return '（未设置）'
  if ((param.refType || 'ref') === 'fixed')
    return String(param.value ?? param.defaultValue ?? '').trim() || '（未设置）'
  const ref = String(param.ref ?? '').trim()
  return ref || '（未设置）'
}

export function readKnowledgeLimit(
  data: Record<string, unknown>,
  parameters: Parameter[]
) {
  const param = findKnowledgeParam(parameters, 'limit')
  const legacy = data.limit
  const fromParam = param?.value ?? param?.defaultValue
  const raw = fromParam ?? legacy ?? '10'
  return String(raw).trim() || '10'
}

export function buildKnowledgeKeywordPatch(
  data: Record<string, unknown>,
  parameters: Parameter[],
  patch: { refType?: string, ref?: string, fixedValue?: string }
) {
  const nextParams = parameters.map(p => ({ ...p }))
  const idx = nextParams.findIndex(p => p.name === 'keyword')
  const refType = patch.refType ?? (idx >= 0 ? nextParams[idx].refType : 'ref') ?? 'ref'

  let keywordData = ''
  if (refType === 'fixed') {
    keywordData = String(patch.fixedValue ?? '').trim()
    if (idx >= 0) {
      nextParams[idx] = {
        ...nextParams[idx],
        refType: 'fixed',
        value: keywordData,
        ref: ''
      }
    }
  }
  else {
    const ref = String(patch.ref ?? '').trim()
    keywordData = ref
    if (idx >= 0) {
      nextParams[idx] = {
        ...nextParams[idx],
        refType: 'ref',
        ref,
        value: ''
      }
    }
  }

  return {
    data: { ...data, keyword: keywordData },
    parameters: nextParams
  }
}

export function buildKnowledgeLimitPatch(
  data: Record<string, unknown>,
  parameters: Parameter[],
  limit: string
) {
  const value = String(limit).trim() || '10'
  const nextParams = parameters.map(p => ({ ...p }))
  const idx = nextParams.findIndex(p => p.name === 'limit')
  if (idx >= 0) {
    nextParams[idx] = {
      ...nextParams[idx],
      refType: 'fixed',
      value,
      defaultValue: value
    }
  }
  return {
    data: { ...data, limit: value },
    parameters: nextParams
  }
}
