import type { TinyflowData } from '@tinyflow-ai/ui'
import { getTinyflowHostRoot } from './tinyflow-host'

export const START_API_NODE_TYPE = 'node_start_api'
export const START_NODE_TYPE = 'startNode'

export interface StartApiWorkflowIssue {
  code: string
  message: string
}

export function findStartApiNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type === START_API_NODE_TYPE)
}

export function hasStartApiNode(workflow: TinyflowData) {
  return findStartApiNodes(workflow).length > 0
}

/** 校验 Api接口开始 节点约束 */
export function validateStartApiWorkflow(workflow: TinyflowData): StartApiWorkflowIssue[] {
  const issues: StartApiWorkflowIssue[] = []
  const nodes = workflow.nodes ?? []
  const edges = workflow.edges ?? []
  const startApiNodes = findStartApiNodes(workflow)

  if (startApiNodes.length > 1) {
    issues.push({
      code: 'MULTIPLE_START_API',
      message: '流程中只能有一个「Api接口开始」节点'
    })
  }

  if (startApiNodes.length === 0)
    return issues

  const startApiId = startApiNodes[0].id
  if (startApiId && edges.some(e => e.target === startApiId)) {
    issues.push({
      code: 'START_API_NOT_ENTRY',
      message: '「Api接口开始」只能作为流程起点，不能连接上游节点'
    })
  }

  if (nodes.some(n => n.type === START_NODE_TYPE)) {
    issues.push({
      code: 'DUPLICATE_START',
      message: '请勿同时使用「开始节点」与「Api接口开始」'
    })
  }

  return issues
}

/**
 * 自动修正：
 * - 仅保留一个 Api接口开始
 * - 移除指向 Api接口开始 的入边
 * - 存在 Api接口开始 时移除「开始节点」及其连线
 */
export function normalizeStartApiWorkflow<T extends TinyflowData>(workflow: T): T {
  const startApiNodes = findStartApiNodes(workflow)
  if (startApiNodes.length === 0)
    return workflow

  let nodes = [...(workflow.nodes ?? [])]
  let edges = [...(workflow.edges ?? [])]

  const primary = startApiNodes[0]
  const primaryId = primary.id
  const extraApiIds = new Set(
    startApiNodes.slice(1).map(n => n.id).filter((id): id is string => Boolean(id))
  )

  if (extraApiIds.size > 0) {
    nodes = nodes.filter(n => !n.id || !extraApiIds.has(n.id))
    edges = edges.filter(e => !extraApiIds.has(e.source) && !extraApiIds.has(e.target))
  }

  if (primaryId)
    edges = edges.filter(e => e.target !== primaryId)

  const startNodeIds = new Set(
    nodes.filter(n => n.type === START_NODE_TYPE).map(n => n.id).filter((id): id is string => Boolean(id))
  )
  if (startNodeIds.size > 0) {
    nodes = nodes.filter(n => n.type !== START_NODE_TYPE)
    edges = edges.filter(e => !startNodeIds.has(e.source) && !startNodeIds.has(e.target))
  }

  return { ...workflow, nodes, edges }
}

export function isStartApiWorkflowChanged(before: TinyflowData, after: TinyflowData) {
  return JSON.stringify(before.nodes) !== JSON.stringify(after.nodes)
    || JSON.stringify(before.edges) !== JSON.stringify(after.edges)
}

/** 隐藏 Api 开始节点的入线连接点（与内置开始节点一致，仅允许作为出口） */
export function patchStartApiNodeDom(canvas: HTMLElement | undefined, workflow: TinyflowData) {
  if (!canvas)
    return

  const apiIds = new Set(
    findStartApiNodes(workflow).map(n => n.id).filter((id): id is string => Boolean(id))
  )
  if (apiIds.size === 0)
    return

  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return

  hostRoot.querySelectorAll('.svelte-flow__node').forEach((nodeEl) => {
    const id = nodeEl.getAttribute('data-id')
    if (!id || !apiIds.has(id))
      return
    nodeEl.querySelectorAll('.svelte-flow__handle').forEach((handle) => {
      const el = handle as HTMLElement
      const isTarget = el.classList.contains('target')
        || el.getAttribute('data-handlepos') === 'top'
      if (isTarget) {
        el.style.display = 'none'
        el.style.pointerEvents = 'none'
      }
    })
  })
}
