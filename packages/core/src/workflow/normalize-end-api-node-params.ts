import type { TinyflowData } from '@tinyflow-ai/ui'
import {
  DEFAULT_END_API_INCLUDE_EXECUTION_DETAILS,
  END_API_NODE_TYPE
} from '../nodes/node-end-api'
import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'
import { syncEndApiParamsAndOutputDefs } from './end-api-param-sync'

export {
  syncEndApiFromParameters,
  syncEndApiFromOutputDefs,
  syncEndApiParamsAndOutputDefs
} from './end-api-param-sync'

export function findEndApiNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type === END_API_NODE_TYPE)
}

export function hasEndApiNode(workflow: TinyflowData) {
  return findEndApiNodes(workflow).length > 0
}

/** 为 Api接口结束补齐默认值，并同步 parameters ↔ outputDefs */
export function normalizeEndApiNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== END_API_NODE_TYPE)
      return node

    let data = { ...(node.data ?? {}) } as Record<string, unknown>
    const before = JSON.stringify(data)

    const raw = data.includeExecutionDetails
    if (typeof raw === 'boolean')
      data.includeExecutionDetails = raw ? 'true' : 'false'
    else if (!(typeof raw === 'string' && raw.trim()))
      data.includeExecutionDetails = DEFAULT_END_API_INCLUDE_EXECUTION_DETAILS

    data = syncEndApiParamsAndOutputDefs(data)
    if (JSON.stringify(data) === before)
      return node
    changed = true
    return { ...node, data }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}

/** 隐藏 Api接口结束 的出线连接点（流程终点） */
export function patchEndApiNodeDom(canvas: HTMLElement | undefined, workflow: TinyflowData) {
  if (!canvas)
    return

  const endIds = new Set(
    findEndApiNodes(workflow).map(n => n.id).filter((id): id is string => Boolean(id))
  )
  if (endIds.size === 0)
    return

  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return

  hostRoot.querySelectorAll('.svelte-flow__node').forEach((nodeEl) => {
    const id = nodeEl.getAttribute('data-id')
    if (!id || !endIds.has(id))
      return
    nodeEl.querySelectorAll('.svelte-flow__handle').forEach((handle) => {
      const el = handle as HTMLElement
      const isSource = el.classList.contains('source')
        || el.getAttribute('data-handlepos') === 'bottom'
      if (isSource) {
        el.style.display = 'none'
        el.style.pointerEvents = 'none'
      }
    })
  })
}
