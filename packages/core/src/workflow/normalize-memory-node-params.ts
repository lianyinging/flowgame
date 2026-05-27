import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { MEMORY_READ_NODE_TYPE } from '../nodes/node-memory-read'
import { MEMORY_WRITE_NODE_TYPE } from '../nodes/node-memory-write'
import {
  defaultMemoryWriteParameters,
  parseMemoryWriteGroups
} from './memory-write-groups'
import { memoryReadNodeDefaultParameters } from '../nodes/memory-node-parameters'
import {
  memoryReadNodeOutputDefs,
  memoryWriteNodeOutputDefs
} from '../nodes/memory-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function ensureOutputDefs(
  data: Record<string, unknown>,
  defaults: Parameter[]
): boolean {
  const raw = data.outputDefs
  if (Array.isArray(raw) && raw.length > 0)
    return false
  data.outputDefs = defaults.map(cloneParam)
  return true
}

function ensureMemoryWriteParameters(data: Record<string, unknown>): boolean {
  const raw = data.parameters
  if (!Array.isArray(raw) || !raw.length) {
    data.parameters = defaultMemoryWriteParameters().map(cloneParam)
    return true
  }
  if (!parseMemoryWriteGroups(raw as Parameter[]).length) {
    data.parameters = defaultMemoryWriteParameters().map(cloneParam)
    return true
  }
  return false
}

/** 记忆写入/提取节点补齐默认 parameters、outputDefs（写入 node.data 供画布与侧栏展示） */
export function normalizeMemoryNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type === MEMORY_WRITE_NODE_TYPE) {
      const data = { ...(node.data ?? {}) } as Record<string, unknown>
      let nodeChanged = false
      if (ensureMemoryWriteParameters(data))
        nodeChanged = true
      if (ensureOutputDefs(data, memoryWriteNodeOutputDefs))
        nodeChanged = true
      if (!nodeChanged)
        return node
      changed = true
      return { ...node, data }
    }

    if (node.type === MEMORY_READ_NODE_TYPE) {
      const data = { ...(node.data ?? {}) } as Record<string, unknown>
      let nodeChanged = false
      const rawParams = data.parameters
      if (!Array.isArray(rawParams) || !rawParams.length) {
        data.parameters = memoryReadNodeDefaultParameters.map(cloneParam)
        nodeChanged = true
      }
      if (ensureOutputDefs(data, memoryReadNodeOutputDefs))
        nodeChanged = true
      if (!nodeChanged)
        return node
      changed = true
      return { ...node, data }
    }

    return node
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}
