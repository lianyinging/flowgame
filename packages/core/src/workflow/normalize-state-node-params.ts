import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { STATE_MACHINE_NODE_TYPE } from '../nodes/node-state-machine'
import { readStateMachineMode } from '../nodes/state-machine-modes'
import {
  stateMachineReadParameters,
  stateMachineUpdateParameters,
  stateMachineWriteParameters
} from '../nodes/state-node-parameters'
import { stateMachineNodeOutputDefs } from '../nodes/state-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function defaultParametersForMode(mode: ReturnType<typeof readStateMachineMode>): Parameter[] {
  if (mode === 'read' || mode === 'delete')
    return stateMachineReadParameters.map(cloneParam)
  if (mode === 'update')
    return stateMachineUpdateParameters.map(cloneParam)
  return stateMachineWriteParameters.map(cloneParam)
}

function ensureOutputDefs(data: Record<string, unknown>): boolean {
  const raw = data.outputDefs
  if (Array.isArray(raw) && raw.length > 0)
    return false
  data.outputDefs = stateMachineNodeOutputDefs.map(cloneParam)
  return true
}

function ensureDefaults(data: Record<string, unknown>): boolean {
  let changed = false
  if (!data.mode) {
    data.mode = 'write'
    changed = true
  }
  if (!data.namespace) {
    data.namespace = 'default'
    changed = true
  }
  if (!data.keyTemplate) {
    data.keyTemplate = '{{entityKey}}'
    changed = true
  }
  if (data.expireSeconds === undefined || data.expireSeconds === '') {
    data.expireSeconds = '86400'
    changed = true
  }
  if (data.refreshTtl === undefined) {
    data.refreshTtl = 'true'
    changed = true
  }
  if (!data.defaultStatus) {
    data.defaultStatus = 'unknown'
    changed = true
  }
  if (data.failIfMissing === undefined) {
    data.failIfMissing = 'false'
    changed = true
  }
  if (data.returnLastState === undefined) {
    data.returnLastState = 'true'
    changed = true
  }
  return changed
}

/** 状态机节点补齐默认 data、parameters、outputDefs */
export function normalizeStateNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== STATE_MACHINE_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false
    if (ensureDefaults(data))
      nodeChanged = true
    if (ensureOutputDefs(data))
      nodeChanged = true

    const mode = readStateMachineMode(data)
    const rawParams = data.parameters
    if (!Array.isArray(rawParams) || !rawParams.length) {
      data.parameters = defaultParametersForMode(mode).map(cloneParam)
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

/** 切换模式时重置为对应默认入参（供编辑器调用） */
export function defaultStateParametersForMode(
  mode: ReturnType<typeof readStateMachineMode>
): Parameter[] {
  return defaultParametersForMode(mode).map(cloneParam)
}
