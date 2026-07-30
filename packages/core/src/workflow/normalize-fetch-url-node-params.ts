import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import {
  DEFAULT_FETCH_URL_MAX_CHARS,
  FETCH_URL_NODE_TYPE
} from '../nodes/node-fetch-url'
import { fetchUrlNodeDefaultParameters } from '../nodes/fetch-url-node-parameters'
import { fetchUrlNodeOutputDefs } from '../nodes/fetch-url-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function ensureUrlsParameter(rawParams: Parameter[]): { params: Parameter[], changed: boolean } {
  const hasUrls = rawParams.some(p => p.name === 'urls')
  if (hasUrls) {
    // 去掉旧的单 url 参数，避免重复
    const next = rawParams.filter(p => p.name !== 'url')
    return { params: next, changed: next.length !== rawParams.length }
  }

  const urlIdx = rawParams.findIndex(p => p.name === 'url')
  if (urlIdx >= 0) {
    const old = rawParams[urlIdx]!
    const migrated = cloneParam(fetchUrlNodeDefaultParameters[0]!)
    migrated.ref = old.ref
    migrated.refType = old.refType
    migrated.value = old.value
    migrated.defaultValue = old.defaultValue
    const next = [...rawParams]
    next[urlIdx] = migrated
    return { params: next, changed: true }
  }

  return {
    params: [cloneParam(fetchUrlNodeDefaultParameters[0]!), ...rawParams],
    changed: true
  }
}

function ensureDocumentsOutput(rawOut: Parameter[]): { outputs: Parameter[], changed: boolean } {
  if (!rawOut.length)
    return { outputs: fetchUrlNodeOutputDefs.map(cloneParam), changed: true }
  if (rawOut.some(p => p.name === 'documents'))
    return { outputs: rawOut, changed: false }
  // 旧节点只有单条字段：在前方插入 documents
  const docs = cloneParam(fetchUrlNodeOutputDefs[0]!)
  return { outputs: [docs, ...rawOut], changed: true }
}

export function normalizeFetchUrlNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== FETCH_URL_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false

    const rawParams = Array.isArray(data.parameters) ? [...(data.parameters as Parameter[])] : []
    const ensured = ensureUrlsParameter(rawParams)
    if (ensured.changed) {
      data.parameters = ensured.params
      nodeChanged = true
    }

    const rawOut = Array.isArray(data.outputDefs) ? [...(data.outputDefs as Parameter[])] : []
    const outEnsured = ensureDocumentsOutput(rawOut)
    if (outEnsured.changed) {
      data.outputDefs = outEnsured.outputs
      nodeChanged = true
    }

    if (typeof data.maxChars !== 'string' || !String(data.maxChars).trim()) {
      data.maxChars = DEFAULT_FETCH_URL_MAX_CHARS
      nodeChanged = true
    }

    if (!nodeChanged)
      return node
    changed = true
    return { ...node, data }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}
