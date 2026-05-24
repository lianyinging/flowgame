import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { LLMAPI_NODE_TYPE } from '../nodes/node-llmapi'
import {
  llmApiNodeDefaultParameters,
  llmApiUserMessageParameter
} from '../nodes/llmapi-node-parameters'
import { llmApiNodeOutputDefs } from '../nodes/llmapi-node-output-defs'

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

function ensureOutputDefs(data: Record<string, unknown>) {
  const raw = data.outputDefs
  if (Array.isArray(raw) && raw.length > 0)
    return false
  data.outputDefs = llmApiNodeOutputDefs.map(cloneParam)
  return true
}

/** 为模型调用节点补齐默认输入/输出参数定义 */
export function normalizeLlmApiNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== LLMAPI_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false

    const rawParams = Array.isArray(data.parameters) ? [...(data.parameters as Parameter[])] : []
    const beforeParams = JSON.stringify(rawParams)
    if (!rawParams.length) {
      data.parameters = llmApiNodeDefaultParameters.map(cloneParam)
      nodeChanged = true
    }
    else if (upsertNamedParam(rawParams, 'userMessage', () => cloneParam(llmApiUserMessageParameter))) {
      data.parameters = rawParams
      nodeChanged = true
    }
    else if (JSON.stringify(rawParams) !== beforeParams) {
      data.parameters = rawParams
      nodeChanged = true
    }

    if (ensureOutputDefs(data))
      nodeChanged = true

    if (!nodeChanged)
      return node

    changed = true
    return { ...node, data }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}
