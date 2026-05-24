import type { TinyflowData } from '@tinyflow-ai/ui'
import { getNodeTypeLabel } from './node-inspector-config'
import type { FlowRunPlanNode } from './flow-run-types'

interface FlowEdge {
  source?: string
  target?: string
}

interface FlowNode {
  id?: string
  type?: string
  data?: Record<string, unknown>
}

function nodeLabel(node: FlowNode): string {
  const data = node.data ?? {}
  const title = data.title
  if (typeof title === 'string' && title.trim())
    return title.trim()
  if (node.type)
    return getNodeTypeLabel(node.type)
  return node.id ?? '未命名节点'
}

/** 按画布连线顺序生成试运行展示列表（起点 BFS，未连线节点追加在末尾） */
export function buildWorkflowRunPlan(workflow: TinyflowData): FlowRunPlanNode[] {
  const nodes = (workflow.nodes ?? []) as FlowNode[]
  const edges = (workflow.edges ?? []) as FlowEdge[]
  if (!nodes.length)
    return []

  const nodeMap = new Map<string, FlowNode>()
  for (const node of nodes) {
    if (node.id)
      nodeMap.set(node.id, node)
  }

  const targets = new Set<string>()
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const source = edge.source
    const target = edge.target
    if (!source || !target || !nodeMap.has(source) || !nodeMap.has(target))
      continue
    targets.add(target)
    const list = adjacency.get(source) ?? []
    list.push(target)
    adjacency.set(source, list)
  }

  const startIds = nodes
    .map(n => n.id)
    .filter((id): id is string => !!id && !targets.has(id))

  const orderedIds: string[] = []
  const visited = new Set<string>()
  const queue = [...startIds]

  if (!queue.length) {
    for (const node of nodes) {
      if (node.id)
        queue.push(node.id)
    }
  }

  while (queue.length) {
    const id = queue.shift()!
    if (visited.has(id))
      continue
    visited.add(id)
    orderedIds.push(id)
    for (const next of adjacency.get(id) ?? [])
      queue.push(next)
  }

  for (const node of nodes) {
    if (node.id && !visited.has(node.id))
      orderedIds.push(node.id)
  }

  return orderedIds
    .map((id) => {
      const node = nodeMap.get(id)
      if (!node)
        return null
      return {
        id,
        type: node.type,
        label: nodeLabel(node)
      }
    })
    .filter((item): item is FlowRunPlanNode => item != null)
}
