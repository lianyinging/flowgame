import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import {
  DEFAULT_LLMAPI_PROVIDER,
  LLMAPI_NODE_TYPE,
  inferLlmApiProviderFromUrl,
  isLlmApiTemplateValue,
  normalizeLlmApiProvider,
  resolveLlmApiModelForProvider
} from '../nodes/node-llmapi'
import {
  createLlmApiBindableParameter,
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

/** 入参 fixed 值写成 {{apiKey}} 会自引用，清成空并改为 ref */
function scrubSelfRefFixedParams(params: Parameter[]): boolean {
  let changed = false
  for (const p of params) {
    const name = String(p.name || '').trim()
    if (!name || !['modelProvider', 'modelName', 'apiKey'].includes(name))
      continue
    const refType = (p.refType || 'ref') as string
    const value = String(p.value ?? '').trim()
    if (refType === 'fixed' && isLlmApiTemplateValue(value)) {
      p.refType = 'ref'
      p.value = ''
      p.ref = p.ref || ''
      changed = true
    }
  }
  return changed
}

function ensureBindableParams(data: Record<string, unknown>): boolean {
  const rawParams = Array.isArray(data.parameters)
    ? [...(data.parameters as Parameter[])]
    : []

  if (!rawParams.length) {
    data.parameters = llmApiNodeDefaultParameters.map(cloneParam)
    return true
  }

  let changed = scrubSelfRefFixedParams(rawParams)
  const factories: Array<[string, () => Parameter]> = [
    ['modelProvider', () => createLlmApiBindableParameter('modelProvider')],
    ['modelName', () => createLlmApiBindableParameter('modelName')],
    ['apiKey', () => createLlmApiBindableParameter('apiKey')],
    ['userMessage', () => cloneParam(llmApiUserMessageParameter)]
  ]
  for (const [name, factory] of factories) {
    if (upsertNamedParam(rawParams, name, factory))
      changed = true
  }
  if (changed)
    data.parameters = rawParams
  return changed
}

/** 为模型调用节点补齐默认参数，并将旧 modelApiUrl 迁移为 modelProvider */
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

    if (ensureOutputDefs(data))
      nodeChanged = true

    const providerRaw = data.modelProvider ?? data.provider
    const hasProvider = typeof providerRaw === 'string' && providerRaw.trim()
    if (!hasProvider) {
      const legacyUrl = typeof data.modelApiUrl === 'string' ? data.modelApiUrl : ''
      data.modelProvider = inferLlmApiProviderFromUrl(legacyUrl)
      nodeChanged = true
    }

    const providerText = String(data.modelProvider || '').trim()
    if (!isLlmApiTemplateValue(providerText)) {
      const provider = normalizeLlmApiProvider(providerText || DEFAULT_LLMAPI_PROVIDER)
      if (providerText !== provider) {
        data.modelProvider = provider
        nodeChanged = true
      }
      const resolvedModel = resolveLlmApiModelForProvider(provider, data.modelName)
      if (String(data.modelName || '').trim() !== resolvedModel) {
        data.modelName = resolvedModel
        nodeChanged = true
      }
    }
    else if (!String(data.modelName || '').trim()) {
      data.modelName = '{{modelName}}'
      nodeChanged = true
    }

    if (ensureBindableParams(data))
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
