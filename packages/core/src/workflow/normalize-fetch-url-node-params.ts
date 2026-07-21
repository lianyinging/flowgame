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
    if (!rawParams.length) {
      data.parameters = fetchUrlNodeDefaultParameters.map(cloneParam)
      nodeChanged = true
    }
    else if (!rawParams.some(p => p.name === 'url')) {
      data.parameters = [cloneParam(fetchUrlNodeDefaultParameters[0]!), ...rawParams]
      nodeChanged = true
    }

    const rawOut = data.outputDefs
    if (!Array.isArray(rawOut) || rawOut.length === 0) {
      data.outputDefs = fetchUrlNodeOutputDefs.map(cloneParam)
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
