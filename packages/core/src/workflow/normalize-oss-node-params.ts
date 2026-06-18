import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import {
  DEFAULT_OSS_OBJECT_KEY_TEMPLATE,
  OSS_NODE_TYPE
} from '../nodes/node-oss'
import { DEFAULT_OSS_FILE_TYPE } from '../nodes/oss-file-types'
import {
  ossContentParameter,
  ossNodeDefaultParameters,
  ossObjectKeyParameter
} from '../nodes/oss-node-parameters'
import { ossNodeOutputDefs } from '../nodes/oss-node-output-defs'

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
  data.outputDefs = ossNodeOutputDefs.map(cloneParam)
  return true
}

function ensureStringField(data: Record<string, unknown>, key: string, value: string): boolean {
  const raw = data[key]
  if (typeof raw === 'string' && raw.trim())
    return false
  data[key] = value
  return true
}

/** 为对象存储节点补齐默认入参/出参与 fileType；保留用户自定义添加的入参 */
export function normalizeOssNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== OSS_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false

    const rawParams = Array.isArray(data.parameters) ? [...(data.parameters as Parameter[])] : []
    const beforeParams = JSON.stringify(rawParams)

    if (!rawParams.length) {
      data.parameters = ossNodeDefaultParameters.map(cloneParam)
      nodeChanged = true
    }
    else {
      if (upsertNamedParam(rawParams, 'content', () => cloneParam(ossContentParameter)))
        nodeChanged = true
      if (upsertNamedParam(rawParams, 'objectKey', () => cloneParam(ossObjectKeyParameter)))
        nodeChanged = true
      if (JSON.stringify(rawParams) !== beforeParams) {
        data.parameters = rawParams
        nodeChanged = true
      }
    }

    if (ensureOutputDefs(data))
      nodeChanged = true
    if (ensureStringField(data, 'fileType', DEFAULT_OSS_FILE_TYPE))
      nodeChanged = true
    if (ensureStringField(data, 'objectKeyTemplate', DEFAULT_OSS_OBJECT_KEY_TEMPLATE))
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
