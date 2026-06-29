import type { TinyflowData } from '@tinyflow-ai/ui'
import { START_API_NODE_TYPE } from './workflow-start-api-rules'
import { START_TALK_NODE_TYPE } from './workflow-talk-rules'
import { talkNodeOutputDefs } from '../nodes/talk-node-output-defs'

export interface WorkflowVariableTreeNode {
  key: string
  title: string
  /** 可复制的引用路径，如 node_xxx.field */
  refPath?: string
  children?: WorkflowVariableTreeNode[]
}

interface FlowParameter {
  name?: string
  dataType?: string
  children?: FlowParameter[]
  contentType?: string
  formType?: string
}

interface FlowNode {
  id: string
  type?: string
  parentId?: string
  data?: Record<string, unknown>
}

function isTextContent(param: FlowParameter) {
  return param.contentType === 'text' || !param.contentType
}

function formatTypeSuffix(dataType?: string, useArrayBracket = false) {
  if (!dataType)
    return useArrayBracket ? ' (Array<>)' : ''
  return useArrayBracket ? ` (Array<${dataType}>)` : ` (${dataType})`
}

function mapOutputDefs(
  outputDefs: FlowParameter[],
  prefix: string,
  isLoopNode: boolean
): WorkflowVariableTreeNode[] {
  return outputDefs
    .filter(def => def.name)
    .map((def) => {
      const useArray = isLoopNode && !isTextContent(def) && def.formType === 'checkbox'
      const path = `${prefix}.${def.name}`
      const children = def.children?.length
        ? mapOutputDefs(def.children, path, isLoopNode)
        : undefined
      return {
        key: path,
        title: `${def.name}${formatTypeSuffix(def.dataType, useArray)}`,
        refPath: path,
        children: children?.length ? children : undefined
      }
    })
}

function buildNodeBranch(node: FlowNode): WorkflowVariableTreeNode | null {
  const data = node.data ?? {}
  const label = String(data.title || node.type || node.id)
  const branch: WorkflowVariableTreeNode = {
    key: node.id,
    title: label,
    children: []
  }

  if (node.type === 'startNode') {
    const params = data.parameters as FlowParameter[] | undefined
    if (params?.length) {
      branch.children = params.map(param => ({
        key: `${node.id}.${param.name}`,
        title: `${param.name}${formatTypeSuffix(param.dataType, !isTextContent(param) && param.formType === 'checkbox')}`,
        refPath: `${node.id}.${param.name}`
      }))
    }
  }
  else if (node.type === START_API_NODE_TYPE) {
    const methodKey = data.methodKey
    if (methodKey)
      branch.children!.push({
        key: `${node.id}.__methodKey__`,
        title: `methodKey: ${methodKey}`,
        refPath: undefined
      })
    const outputDefs = data.outputDefs as FlowParameter[] | undefined
    if (outputDefs?.length)
      branch.children!.push(...mapOutputDefs(outputDefs, node.id, false))
  }
  else if (node.type === START_TALK_NODE_TYPE) {
    const methodKey = data.methodKey
    if (methodKey) {
      branch.children!.push({
        key: `${node.id}.__methodKey__`,
        title: `methodKey: ${methodKey}`,
        refPath: undefined
      })
    }
    const outputDefs = (data.outputDefs as FlowParameter[] | undefined)?.length
      ? (data.outputDefs as FlowParameter[])
      : talkNodeOutputDefs
    branch.children!.push(...mapOutputDefs(outputDefs, node.id, false))
  }
  else if (node.type === 'loopNode') {
    branch.children!.push(
      { key: `${node.id}.loopItem`, title: 'loopItem', refPath: `${node.id}.loopItem` },
      { key: `${node.id}.index`, title: 'index (Number)', refPath: `${node.id}.index` }
    )
    const outputDefs = data.outputDefs as FlowParameter[] | undefined
    if (outputDefs?.length)
      branch.children!.push(...mapOutputDefs(outputDefs, node.id, true))
  }
  else {
    const outputDefs = data.outputDefs as FlowParameter[] | undefined
    if (outputDefs?.length)
      branch.children = mapOutputDefs(outputDefs, node.id, false)
  }

  if (!branch.children?.length)
    delete branch.children

  return branch
}

function sortNodesByFlow(nodes: FlowNode[], edges: { source?: string, target?: string }[]) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const ids = new Set(nodes.map(n => n.id))
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const id of ids) {
    inDegree.set(id, 0)
    adj.set(id, [])
  }
  for (const edge of edges) {
    if (!edge.source || !edge.target || !ids.has(edge.source) || !ids.has(edge.target))
      continue
    adj.get(edge.source)!.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue = [...ids].filter(id => (inDegree.get(id) ?? 0) === 0)
  const ordered: FlowNode[] = []
  while (queue.length) {
    const id = queue.shift()!
    const node = nodeMap.get(id)
    if (node)
      ordered.push(node)
    for (const next of adj.get(id) ?? []) {
      const nextDegree = (inDegree.get(next) ?? 0) - 1
      inDegree.set(next, nextDegree)
      if (nextDegree === 0)
        queue.push(next)
    }
  }

  for (const node of nodes) {
    if (!ordered.includes(node))
      ordered.push(node)
  }
  return ordered
}

/** 根据当前工作流构建变量树（与 Tinyflow 节点引用结构一致） */
export function buildWorkflowVariableTree(workflow: TinyflowData): WorkflowVariableTreeNode[] {
  const nodes = (workflow.nodes ?? []) as FlowNode[]
  const edges = workflow.edges ?? []
  if (!nodes.length)
    return []

  const topLevel = nodes.filter(n => !n.parentId)
  const ordered = sortNodesByFlow(topLevel, edges)

  return ordered
    .map(node => buildNodeBranch(node))
    .filter((item): item is WorkflowVariableTreeNode => Boolean(item))
}

/** 当前节点的所有上游节点 id（沿连线反向遍历，与 Tinyflow 参数引用树一致） */
export function collectUpstreamNodeIds(
  currentNodeId: string,
  edges: { source?: string, target?: string }[] = []
): Set<string> {
  const upstream = new Set<string>()
  const stack = [currentNodeId]
  const seen = new Set<string>()

  while (stack.length) {
    const targetId = stack.pop()!
    for (const edge of edges) {
      if (edge.target !== targetId || !edge.source || seen.has(edge.source))
        continue
      seen.add(edge.source)
      upstream.add(edge.source)
      stack.push(edge.source)
    }
  }

  return upstream
}

export interface RefSelectTreeNode {
  key: string
  title: string
  /** 叶子节点可选中的引用路径 */
  value?: string
  children?: RefSelectTreeNode[]
}

function toRefSelectTree(nodes: WorkflowVariableTreeNode[]): RefSelectTreeNode[] {
  return nodes.map((node) => {
    const children = node.children?.length ? toRefSelectTree(node.children) : undefined
    return {
      key: node.refPath ?? node.key,
      title: node.title,
      value: node.refPath,
      children: children?.length ? children : undefined
    }
  })
}

/** 供参数「引用」类型下拉：仅包含当前节点上游可引用的变量树 */
export function buildUpstreamRefSelectTree(
  workflow: TinyflowData,
  currentNodeId: string
): RefSelectTreeNode[] {
  const nodes = (workflow.nodes ?? []) as FlowNode[]
  const edges = workflow.edges ?? []
  if (!currentNodeId || !nodes.length)
    return []

  const upstreamIds = collectUpstreamNodeIds(currentNodeId, edges)
  const branches: WorkflowVariableTreeNode[] = []

  for (const node of nodes) {
    if (!upstreamIds.has(node.id))
      continue
    const branch = buildNodeBranch(node)
    if (branch)
      branches.push(branch)
  }

  let result = toRefSelectTree(branches)

  const talkNode = nodes.find(n => n.type === START_TALK_NODE_TYPE)
  if (talkNode && !upstreamIds.has(talkNode.id)) {
    const talkBranch = buildNodeBranch(talkNode)
    if (talkBranch?.children?.length)
      result = [...toRefSelectTree([talkBranch]), ...result]
  }

  return result
}
