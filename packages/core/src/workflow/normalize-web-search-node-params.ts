import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { WEB_SEARCH_NODE_TYPE } from '../nodes/node-web-search'
import {
  DEFAULT_WEB_SEARCH_ENGINES,
  normalizeWebSearchEngines
} from '../nodes/web-search-engines'
import { webSearchNodeDefaultParameters } from '../nodes/web-search-node-parameters'
import { webSearchNodeOutputDefs } from '../nodes/web-search-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function upsertNamedParam(
  params: Parameter[],
  name: string,
  factory: () => Parameter
) {
  if (params.some(p => p.name === name))
    return false
  params.push(factory())
  return true
}

export function normalizeWebSearchNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== WEB_SEARCH_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false

    const rawParams = Array.isArray(data.parameters) ? [...(data.parameters as Parameter[])] : []
    if (!rawParams.length) {
      data.parameters = webSearchNodeDefaultParameters.map(cloneParam)
      nodeChanged = true
    }
    else {
      const before = JSON.stringify(rawParams)
      upsertNamedParam(rawParams, 'limit', () => cloneParam(webSearchNodeDefaultParameters[0]!))
      upsertNamedParam(rawParams, 'keyword', () => cloneParam(webSearchNodeDefaultParameters[1]!))
      if (JSON.stringify(rawParams) !== before) {
        data.parameters = rawParams
        nodeChanged = true
      }
    }

    const rawOut = data.outputDefs
    if (!Array.isArray(rawOut) || rawOut.length === 0) {
      data.outputDefs = webSearchNodeOutputDefs.map(cloneParam)
      nodeChanged = true
    }

    const engines = normalizeWebSearchEngines(data.engines)
    if (JSON.stringify(data.engines) !== JSON.stringify(engines)) {
      data.engines = engines
      nodeChanged = true
    }
    else if (!Array.isArray(data.engines)) {
      data.engines = [...DEFAULT_WEB_SEARCH_ENGINES]
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
