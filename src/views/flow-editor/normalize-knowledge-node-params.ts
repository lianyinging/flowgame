import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { displayKbBaseName } from '@/api/flow-game/kb-collection'
import {
  knowledgeKeywordParameter,
  knowledgeLimitParameter,
  knowledgeNodeDefaultParameters
} from './knowledge-node-parameters'
import {
  KNOWLEDGE_NODE_TYPES,
  readKnowledgeKeyword,
  readKnowledgeLimit
} from './knowledge-node-inspector'
import { createKnowledgeNodeDefaultOutputDefs } from './knowledge-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function upsertNamedParam(
  params: Parameter[],
  name: string,
  factory: () => Parameter,
  patch?: (p: Parameter) => void
) {
  const idx = params.findIndex(p => p.name === name)
  if (idx >= 0) {
    const next = { ...params[idx] }
    patch?.(next)
    params[idx] = next
    return
  }
  const created = factory()
  patch?.(created)
  params.push(created)
}

function syncKnowledgeBaseFields(data: Record<string, unknown>) {
  const raw = String(
    data.collectionName ?? data.knowledgeId ?? data.knowledgeCollection ?? ''
  ).trim()
  if (!raw)
    return data
  let base = raw
  try {
    base = displayKbBaseName(raw)
  }
  catch {
    // 保留原值
  }
  return {
    ...data,
    collectionName: base,
    knowledgeId: base,
    knowledgeCollection: base
  }
}

function ensureKnowledgeOutputDefs(outputDefs: Parameter[]) {
  if (!outputDefs.length)
    return createKnowledgeNodeDefaultOutputDefs().map(cloneParam)
  const names = new Set(outputDefs.map(p => p.name).filter(Boolean))
  if (names.has('documents'))
    return outputDefs
  return [
    ...outputDefs,
    ...createKnowledgeNodeDefaultOutputDefs()
      .filter(d => !names.has(d.name))
      .map(cloneParam)
  ]
}

/** 知识库节点：补齐 Collection、keyword/limit、默认输出 */
export function normalizeKnowledgeNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (!node.type || !KNOWLEDGE_NODE_TYPES.has(node.type))
      return node

    let nodeType = node.type
    if (nodeType === 'knowledgeNode') {
      nodeType = 'knowledgeNodePlus'
      changed = true
    }

    let data = { ...(node.data ?? {}) } as Record<string, unknown>
    if (nodeType === 'knowledgeNodePlus' && (!data.title || data.title === '知识库')) {
      data = { ...data, title: '知识库 Plus' }
      changed = true
    }
    const legacyKeyword = typeof data.keyword === 'string' ? data.keyword.trim() : ''
    const legacyLimit = typeof data.limit === 'string' || typeof data.limit === 'number'
      ? String(data.limit).trim()
      : ''

    const rawParams = Array.isArray(data.parameters) ? [...(data.parameters as Parameter[])] : []
    const rawOutputs = Array.isArray(data.outputDefs) ? [...(data.outputDefs as Parameter[])] : []
    const before = JSON.stringify({ parameters: rawParams, outputDefs: rawOutputs, data })

    upsertNamedParam(rawParams, 'keyword', () => cloneParam(knowledgeKeywordParameter), (p) => {
      if (legacyKeyword && !p.ref && !p.value) {
        p.refType = 'fixed'
        p.value = legacyKeyword
      }
    })

    upsertNamedParam(rawParams, 'limit', () => cloneParam(knowledgeLimitParameter), (p) => {
      if (legacyLimit) {
        p.value = legacyLimit
        p.defaultValue = legacyLimit
      }
    })

    const nextOutputs = ensureKnowledgeOutputDefs(rawOutputs)
    data = syncKnowledgeBaseFields(data)

    const mergedParams = rawParams.length
      ? rawParams
      : knowledgeNodeDefaultParameters.map(cloneParam)
    const kw = readKnowledgeKeyword(data, mergedParams)
    const limitVal = readKnowledgeLimit(data, mergedParams)

    const nextData = {
      ...data,
      keyword: kw.refType === 'fixed' ? kw.fixedValue : kw.ref,
      limit: limitVal,
      parameters: mergedParams,
      outputDefs: nextOutputs
    }

    if (JSON.stringify({ parameters: rawParams, outputDefs: rawOutputs, data }) === before
      && !legacyKeyword && !legacyLimit)
      return node

    changed = true
    return { ...node, type: nodeType, data: nextData }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}
