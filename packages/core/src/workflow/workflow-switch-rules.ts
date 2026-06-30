import type { TinyflowData } from '@tinyflow-ai/ui'
import {
  SWITCH_ELSE_CASE_ID,
  defaultSwitchCases,
  parseSwitchCases,
  readSwitchParamName,
  type SwitchCaseDef
} from '../nodes/switch-cases'
import { SWITCH_NODE_TYPE } from '../nodes/node-switch'
import { readBranchEdgeMap, syncIfNodeBranchEdgeMap } from '../nodes/branch-edge-canvas'
import { readEdgeBranch } from './workflow-if-rules'

export interface SwitchWorkflowIssue {
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

function ensureNodeCases(data: Record<string, unknown>): boolean {
  let changed = false
  if (!Array.isArray(data.cases) || !data.cases.length) {
    data.cases = defaultSwitchCases()
    changed = true
  }
  if (data.expand !== true) {
    data.expand = true
    changed = true
  }
  return changed
}

function restoreSwitchBranchEdgesFromMap(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes ?? []
  const edges = workflow.edges ?? []
  if (!edges.length)
    return workflow

  const switchNodes = nodes.filter(n => n.type === SWITCH_NODE_TYPE && n.id)
  if (!switchNodes.length)
    return workflow

  let edgesChanged = false
  const nextEdges = edges.map((edge) => {
    if (!edge.id || !edge.source)
      return edge
    const switchNode = switchNodes.find(n => n.id === edge.source)
    if (!switchNode)
      return edge

    const data = switchNode.data as Record<string, unknown>
    const map = readBranchEdgeMap(data)
    const cases = parseSwitchCases(data)
    const branchIds = [...cases.map(c => c.id), SWITCH_ELSE_CASE_ID]
    const branchId = branchIds.find(id => map[id] === edge.id)
    if (!branchId || readEdgeBranch(edge) === branchId)
      return edge

    edgesChanged = true
    const edgeData = { ...(edge.data ?? {}) } as Record<string, unknown>
    edgeData.branch = branchId
    return { ...edge, data: edgeData }
  })

  if (!edgesChanged)
    return workflow
  return { ...workflow, edges: nextEdges }
}

/** 补齐 cases 结构，出边 branch 由用户在侧栏手动指定 */
export function normalizeSwitchWorkflow(workflow: TinyflowData): TinyflowData {
  const withEdges = restoreSwitchBranchEdgesFromMap(workflow)
  const nodes = withEdges.nodes ?? []
  const edges = withEdges.edges ?? []
  let changed = false

  const nextNodes = nodes.map((node) => {
    if (node.type !== SWITCH_NODE_TYPE || !node.id)
      return node

    const data = { ...(node.data ?? {}) }
    let nodeChanged = ensureNodeCases(data)
    const cases = parseSwitchCases(data)
    const branchIds = [...cases.map(c => c.id), SWITCH_ELSE_CASE_ID]
    if (syncIfNodeBranchEdgeMap(data, node.id, edges, branchIds))
      nodeChanged = true

    if (!nodeChanged)
      return node

    changed = true
    return { ...node, data }
  })

  if (!changed)
    return withEdges

  return {
    ...withEdges,
    nodes: nextNodes
  }
}

export function findSwitchNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type === SWITCH_NODE_TYPE)
}

function countEdgesForBranch(
  edges: TinyflowData['edges'],
  nodeId: string,
  branchId: string
) {
  return (edges ?? []).filter(e => e.source === nodeId && readEdgeBranch(e) === branchId).length
}

export function validateSwitchWorkflow(workflow: TinyflowData): SwitchWorkflowIssue[] {
  const issues: SwitchWorkflowIssue[] = []
  const edges = workflow.edges ?? []

  for (const node of findSwitchNodes(workflow)) {
    const nodeId = node.id
    if (!nodeId)
      continue
    const label = getNodeLabel(node)
    const data = (node.data ?? {}) as Record<string, unknown>
    const cases = parseSwitchCases(data)
    const switchKey = readSwitchParamName(data)

    const params = data.parameters
    const hasSwitchParam = Array.isArray(params)
      && params.some(p => p && typeof p === 'object' && (p as { name?: string }).name === switchKey)
    if (!hasSwitchParam) {
      issues.push({
        code: 'SWITCH_PARAM_MISSING',
        message: `「${label}」须在输入参数中添加名为「${switchKey}」的参数（匹配变量可写 {{${switchKey}}}）并绑定上游变量`,
        nodeId
      })
    }

    const outbound = edges.filter(e => e.source === nodeId)
    const expected = cases.length + 1
    if (outbound.length < expected) {
      issues.push({
        code: 'SWITCH_INSUFFICIENT_BRANCHES',
        message: `「${label}」请从节点右侧连出至少 ${expected} 条下游连线（当前 ${outbound.length} 条）`,
        nodeId
      })
    }

    for (const [index, caseDef] of cases.entries()) {
      if (!(caseDef.value ?? '').trim()) {
        issues.push({
          code: 'SWITCH_CASE_VALUE_EMPTY',
          message: `「${label}」第 ${index + 1} 个 case 须填写匹配值`,
          nodeId
        })
      }
      const count = countEdgesForBranch(edges, nodeId, caseDef.id)
      if (count !== 1) {
        issues.push({
          code: 'SWITCH_CASE_EDGE',
          message: `「${label}」case「${caseDef.value || caseDef.id}」须选择一条已连接的下游出边`,
          nodeId
        })
      }
    }

    const elseCount = countEdgesForBranch(edges, nodeId, SWITCH_ELSE_CASE_ID)
    if (elseCount !== 1) {
      issues.push({
        code: 'SWITCH_ELSE_EDGE',
        message: `「${label}」的「否则」须选择一条已连接的下游出边`,
        nodeId
      })
    }
  }

  return issues
}

export { defaultSwitchCases, parseSwitchCases, readSwitchParamName } from '../nodes/switch-cases'
export type { SwitchCaseDef } from '../nodes/switch-cases'
