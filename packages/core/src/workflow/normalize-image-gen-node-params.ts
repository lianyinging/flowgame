import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import {
  DEFAULT_IMAGE_GEN_BASE_URL,
  DEFAULT_IMAGE_GEN_EXTRA_BODY,
  DEFAULT_IMAGE_GEN_MODEL,
  DEFAULT_IMAGE_GEN_PROMPT_TEMPLATE,
  DEFAULT_IMAGE_GEN_PROVIDER,
  DEFAULT_IMAGE_GEN_SIZE,
  DEFAULT_IMAGE_GEN_TIMEOUT_MS,
  IMAGE_GEN_NODE_TYPE
} from '../nodes/node-image-gen'
import { imageGenNodeDefaultParameters } from '../nodes/image-gen-node-parameters'
import {
  imageGenImageUrlParameter,
  imageGenPromptParameter
} from '../nodes/image-gen-node-parameters'
import { imageGenNodeOutputDefs } from '../nodes/image-gen-node-output-defs'

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

function ensureStringField(data: Record<string, unknown>, key: string, value: string): boolean {
  const raw = data[key]
  if (typeof raw === 'string' && raw.trim())
    return false
  data[key] = value
  return true
}

export function normalizeImageGenNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== IMAGE_GEN_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false

    const rawParams = Array.isArray(data.parameters) ? [...(data.parameters as Parameter[])] : []
    if (!rawParams.length) {
      data.parameters = imageGenNodeDefaultParameters.map(cloneParam)
      nodeChanged = true
    }
    else {
      const before = JSON.stringify(rawParams)
      upsertNamedParam(rawParams, 'prompt', () => cloneParam(imageGenPromptParameter))
      upsertNamedParam(rawParams, 'imageUrl', () => cloneParam(imageGenImageUrlParameter))
      if (JSON.stringify(rawParams) !== before) {
        data.parameters = rawParams
        nodeChanged = true
      }
    }

    const rawOut = data.outputDefs
    if (!Array.isArray(rawOut) || rawOut.length === 0) {
      data.outputDefs = imageGenNodeOutputDefs.map(cloneParam)
      nodeChanged = true
    }

    if (ensureStringField(data, 'baseUrl', DEFAULT_IMAGE_GEN_BASE_URL))
      nodeChanged = true
    if (ensureStringField(data, 'provider', DEFAULT_IMAGE_GEN_PROVIDER))
      nodeChanged = true
    if (ensureStringField(data, 'model', DEFAULT_IMAGE_GEN_MODEL))
      nodeChanged = true
    if (ensureStringField(data, 'size', DEFAULT_IMAGE_GEN_SIZE))
      nodeChanged = true
    if (ensureStringField(data, 'promptTemplate', DEFAULT_IMAGE_GEN_PROMPT_TEMPLATE))
      nodeChanged = true
    if (ensureStringField(data, 'requestTimeoutMs', DEFAULT_IMAGE_GEN_TIMEOUT_MS))
      nodeChanged = true
    if (ensureStringField(data, 'responseFormat', 'url'))
      nodeChanged = true
    if (typeof data.extraBody !== 'string') {
      data.extraBody = DEFAULT_IMAGE_GEN_EXTRA_BODY
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
