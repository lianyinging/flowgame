import type { TinyflowData } from '@tinyflow-ai/ui'
import {
  IF_LEGACY_FALSE_BRANCH_ID,
  IF_LEGACY_TRUE_BRANCH_ID,
  parseIfBranches,
  type IfBranchDef
} from '../nodes/if-branches'
import { readBranchEdgeMap, syncIfNodeBranchEdgeMap } from '../nodes/branch-edge-canvas'
import { IF_NODE_TYPE } from '../nodes/node-if'
import { SWITCH_NODE_TYPE } from '../nodes/node-switch'

/** 画布读回节点时可能丢失 branchEdgeMap，从快照合并保留 */
export function mergeIfNodeBranchEdgeMap(
  canvas: TinyflowData,
  preserved?: TinyflowData
): TinyflowData {
  const canvasNodes = canvas.nodes
  const preservedNodes = preserved?.nodes
  if (!canvasNodes?.length || !preservedNodes?.length)
    return canvas

  const preservedById = new Map(
    preservedNodes.filter(n => n.id).map(n => [n.id!, n])
  )

  let changed = false
  const nodes = canvasNodes.map((node) => {
    if ((node.type !== IF_NODE_TYPE && node.type !== SWITCH_NODE_TYPE) || !node.id)
      return node
    const prev = preservedById.get(node.id)
    const prevMap = readBranchEdgeMap(prev?.data as Record<string, unknown> | undefined)
    if (!Object.keys(prevMap).length)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    const canvasMap = readBranchEdgeMap(data)
    const merged = { ...prevMap, ...canvasMap }
    if (JSON.stringify(merged) === JSON.stringify(canvasMap))
      return node

    changed = true
    return { ...node, data: { ...data, branchEdgeMap: merged } }
  })

  if (!changed)
    return canvas
  return { ...canvas, nodes }
}

export interface IfWorkflowIssue {
  code: string
  message: string
  nodeId?: string
}

function getNodeLabel(node: { id?: string, label?: string, data?: Record<string, unknown> }) {
  const title = node.data?.title
  if (typeof title === 'string' && title.trim())
    return title.trim()
  if (typeof node.label === 'string' && node.label.trim())
    return node.label.trim()
  return node.id || '未命名节点'
}

export function readEdgeBranch(edge: { data?: Record<string, unknown>, sourceHandle?: string | null }) {
  const branch = edge.data?.branch
  if (typeof branch === 'string' && branch.trim())
    return branch.trim()
  const sourceHandle = edge.sourceHandle
  return typeof sourceHandle === 'string' ? sourceHandle.trim() : ''
}

function normalizeEdgeBranch(branch: string) {
  const lower = branch.toLowerCase()
  if (lower === 'false')
    return IF_LEGACY_FALSE_BRANCH_ID
  if (lower === 'true')
    return IF_LEGACY_TRUE_BRANCH_ID
  if (lower === 'else')
    return 'else'
  return branch
}

function ensureNodeBranches(data: Record<string, unknown>): boolean {
  let changed = false
  if (!Array.isArray(data.branches) || !data.branches.length) {
    data.branches = parseIfBranches(data)
    changed = true
  }
  if (data.expand !== true) {
    data.expand = true
    changed = true
  }
  return changed
}

function restoreIfBranchEdgesFromMap(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes ?? []
  const edges = workflow.edges ?? []
  if (!edges.length)
    return workflow

  const ifNodes = nodes.filter(n => n.type === IF_NODE_TYPE && n.id)
  if (!ifNodes.length)
    return workflow

  let edgesChanged = false
  const nextEdges = edges.map((edge) => {
    if (!edge.id || !edge.source)
      return edge
    const ifNode = ifNodes.find(n => n.id === edge.source)
    if (!ifNode)
      return edge

    const map = readBranchEdgeMap(ifNode.data as Record<string, unknown>)
    const branches = parseIfBranches(ifNode.data as Record<string, unknown>)
    const branch = branches.find(b => map[b.id] === edge.id)
    if (!branch || readEdgeBranch(edge) === branch.id)
      return edge

    edgesChanged = true
    const data = { ...(edge.data ?? {}) } as Record<string, unknown>
    data.branch = branch.id
    return { ...edge, data }
  })

  if (!edgesChanged)
    return workflow
  return { ...workflow, edges: nextEdges }
}

/** 补齐 branches 结构，出边 branch 由用户在侧栏手动指定 */
export function normalizeIfWorkflow(workflow: TinyflowData): TinyflowData {
  const withEdges = restoreIfBranchEdgesFromMap(workflow)
  const nodes = withEdges.nodes ?? []
  const edges = withEdges.edges ?? []
  let nodesChanged = false

  const nextNodes = nodes.map((node) => {
    if (node.type !== IF_NODE_TYPE || !node.id)
      return node

    const data = { ...(node.data ?? {}) }
    let changed = ensureNodeBranches(data)
    const branches = parseIfBranches(data)
    if (syncIfNodeBranchEdgeMap(data, node.id, edges, branches.map(b => b.id)))
      changed = true

    if (!changed)
      return node

    nodesChanged = true
    return { ...node, data }
  })

  if (!nodesChanged)
    return withEdges

  return {
    ...withEdges,
    nodes: nextNodes
  }
}

export function findIfNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type === IF_NODE_TYPE)
}

function countEdgesForBranch(
  edges: TinyflowData['edges'],
  nodeId: string,
  branchId: string
) {
  const normalized = normalizeEdgeBranch(branchId)
  return (edges ?? []).filter((e) => {
    if (e.source !== nodeId)
      return false
    const edgeBranch = normalizeEdgeBranch(readEdgeBranch(e))
    if (normalized === IF_LEGACY_FALSE_BRANCH_ID) {
      return edgeBranch === IF_LEGACY_FALSE_BRANCH_ID || edgeBranch === 'else'
    }
    return edgeBranch === normalized
  }).length
}

function validateBranchConditions(label: string, nodeId: string, branches: IfBranchDef[]): IfWorkflowIssue[] {
  const issues: IfWorkflowIssue[] = []
  for (const [index, branch] of branches.entries()) {
    if (branch.type === 'else')
      continue
    const cond = (branch.condition ?? '').trim()
    if (!cond) {
      issues.push({
        code: 'IF_BRANCH_CONDITION_EMPTY',
        message: `「${label}」第 ${index + 1} 条「${branch.type === 'if' ? '如果' : '否则如果'}」须填写条件`,
        nodeId
      })
    }
  }
  if (!branches.some(b => b.type === 'else')) {
    issues.push({
      code: 'IF_MISSING_ELSE',
      message: `「${label}」须包含「否则」默认分支`,
      nodeId
    })
  }
  return issues
}

export function validateIfWorkflow(workflow: TinyflowData): IfWorkflowIssue[] {
  const issues: IfWorkflowIssue[] = []
  const edges = workflow.edges ?? []

  for (const node of findIfNodes(workflow)) {
    const nodeId = node.id
    if (!nodeId)
      continue
    const label = getNodeLabel(node)
    const data = (node.data ?? {}) as Record<string, unknown>
    const branches = parseIfBranches(data)

    issues.push(...validateBranchConditions(label, nodeId, branches))

    const outbound = edges.filter(e => e.source === nodeId)
    if (outbound.length < branches.length) {
      issues.push({
        code: 'IF_INSUFFICIENT_BRANCHES',
        message: `「${label}」请从节点右侧连出至少 ${branches.length} 条下游连线（当前 ${outbound.length} 条）`,
        nodeId
      })
    }

    for (const branch of branches) {
      const count = countEdgesForBranch(edges, nodeId, branch.id)
      if (count !== 1) {
        const branchLabel = branch.type === 'else'
          ? '否则'
          : branch.type === 'if' ? '如果' : '否则如果'
        issues.push({
          code: 'IF_BRANCH_EDGE',
          message: `「${label}」的「${branchLabel}」须选择一条已连接的下游出边`,
          nodeId
        })
      }
    }
  }

  return issues
}

export { defaultIfBranches, parseIfBranches } from '../nodes/if-branches'
export type { IfBranchDef } from '../nodes/if-branches'
