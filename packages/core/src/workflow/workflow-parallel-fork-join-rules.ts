import type { TinyflowData } from '@tinyflow-ai/ui'
import { FORK_NODE_TYPE } from '../nodes/node-fork'
import { JOIN_ALL_NODE_TYPE } from '../nodes/node-join-all'
import { JOIN_ANY_NODE_TYPE } from '../nodes/node-join-any'

const JOIN_TYPE_SET = new Set<string>([JOIN_ALL_NODE_TYPE, JOIN_ANY_NODE_TYPE])

export interface ParallelForkJoinIssue {
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

function buildOutAdjacency(edges: TinyflowData['edges']) {
  const adj: Record<string, string[]> = {}
  for (const edge of edges ?? []) {
    const source = edge.source
    const target = edge.target
    if (!source || !target)
      continue
    if (!adj[source])
      adj[source] = []
    adj[source].push(target)
  }
  return adj
}

function buildInAdjacency(edges: TinyflowData['edges']) {
  const adj: Record<string, string[]> = {}
  for (const edge of edges ?? []) {
    const source = edge.source
    const target = edge.target
    if (!source || !target)
      continue
    if (!adj[target])
      adj[target] = []
    adj[target].push(source)
  }
  return adj
}

/** 从起点沿出边 BFS，收集可达的汇聚节点 id */
function findReachableJoinIds(
  startId: string,
  adj: Record<string, string[]>,
  joinIds: Set<string>
): Set<string> {
  const seen = new Set<string>()
  const queue = [startId]
  const found = new Set<string>()
  while (queue.length > 0) {
    const id = queue.shift()!
    if (seen.has(id))
      continue
    seen.add(id)
    if (joinIds.has(id)) {
      found.add(id)
      continue
    }
    for (const next of adj[id] ?? [])
      queue.push(next)
  }
  return found
}

/** 从节点沿入边反向 BFS，收集可达的分叉节点 id（不穿过其他汇聚节点） */
function findUpstreamForkIds(
  startId: string,
  inAdj: Record<string, string[]>,
  forkIds: Set<string>,
  joinIds: Set<string>
): Set<string> {
  const seen = new Set<string>()
  const queue = [startId]
  const found = new Set<string>()
  while (queue.length > 0) {
    const id = queue.shift()!
    if (seen.has(id))
      continue
    seen.add(id)
    if (forkIds.has(id)) {
      found.add(id)
      continue
    }
    if (joinIds.has(id))
      continue
    for (const prev of inAdj[id] ?? [])
      queue.push(prev)
  }
  return found
}

function intersectSets(sets: Set<string>[]): Set<string> {
  if (!sets.length)
    return new Set()
  let result = new Set(sets[0])
  for (let i = 1; i < sets.length; i++) {
    result = new Set([...result].filter(id => sets[i].has(id)))
  }
  return result
}

export function findForkNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type === FORK_NODE_TYPE)
}

export function findJoinNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type && JOIN_TYPE_SET.has(n.type))
}

/**
 * 试运行前校验：「并行分叉」与「汇聚（全部/任一）」须成对出现并正确连线。
 */
export function validateParallelForkJoinWorkflow(workflow: TinyflowData): ParallelForkJoinIssue[] {
  const issues: ParallelForkJoinIssue[] = []
  const forks = findForkNodes(workflow)
  const joins = findJoinNodes(workflow)
  const edges = workflow.edges ?? []

  if (forks.length && !joins.length) {
    issues.push({
      code: 'FORK_WITHOUT_JOIN',
      message:
        '「并行分叉」与「汇聚（全部/任一）」须成对使用：已添加分叉节点，请补充汇聚节点包裹并行分支'
    })
  }

  if (joins.length && !forks.length) {
    issues.push({
      code: 'JOIN_WITHOUT_FORK',
      message:
        '「并行分叉」与「汇聚（全部/任一）」须成对使用：已添加汇聚节点，请补充分叉节点作为并行起点'
    })
  }

  if (!forks.length || !joins.length)
    return issues

  const adj = buildOutAdjacency(edges)
  const inAdj = buildInAdjacency(edges)
  const joinIds = new Set(
    joins.map(j => j.id).filter((id): id is string => Boolean(id))
  )
  const forkIds = new Set(
    forks.map(f => f.id).filter((id): id is string => Boolean(id))
  )
  const reportedJoinInward = new Set<string>()
  const reportedJoinFork = new Set<string>()

  for (const fork of forks) {
    const forkId = fork.id
    if (!forkId)
      continue
    const label = getNodeLabel(fork)
    const childIds = edges
      .filter(e => e.source === forkId && e.target)
      .map(e => e.target as string)

    if (childIds.length < 2) {
      issues.push({
        code: 'FORK_INSUFFICIENT_BRANCHES',
        message: `「${label}」至少需要连接两条并行分支`,
        nodeId: forkId
      })
      continue
    }

    const reachablePerBranch = childIds.map(childId =>
      findReachableJoinIds(childId, adj, joinIds)
    )
    const commonJoins = intersectSets(reachablePerBranch)

    if (!commonJoins.size) {
      issues.push({
        code: 'FORK_BRANCHES_NOT_JOINED',
        message: `「${label}」的各并行分支须汇合到同一「汇聚（全部）」或「汇聚（任一）」节点后再继续下游`,
        nodeId: forkId
      })
    }

    for (const joinId of commonJoins) {
      if (reportedJoinInward.has(joinId))
        continue
      const joinNode = joins.find(j => j.id === joinId)
      if (!joinNode?.id)
        continue
      const inwardCount = edges.filter(e => e.target === joinId).length
      if (inwardCount < 2) {
        reportedJoinInward.add(joinId)
        issues.push({
          code: 'JOIN_INSUFFICIENT_INWARD',
          message: `「${getNodeLabel(joinNode)}」至少需要两条入边，分别连接各并行分支`,
          nodeId: joinId
        })
      }
    }
  }

  for (const join of joins) {
    const joinId = join.id
    if (!joinId)
      continue
    const label = getNodeLabel(join)
    const inwardSources = edges
      .filter(e => e.target === joinId && e.source)
      .map(e => e.source as string)

    if (inwardSources.length < 2) {
      if (!reportedJoinInward.has(joinId)) {
        reportedJoinInward.add(joinId)
        issues.push({
          code: 'JOIN_INSUFFICIENT_INWARD',
          message: `「${label}」至少需要两条入边，分别连接各并行分支`,
          nodeId: joinId
        })
      }
      continue
    }

    if (reportedJoinFork.has(joinId))
      continue

    const upstreamForksPerBranch = inwardSources.map(sourceId =>
      findUpstreamForkIds(sourceId, inAdj, forkIds, joinIds)
    )
    const commonForks = intersectSets(upstreamForksPerBranch)

    if (!commonForks.size) {
      reportedJoinFork.add(joinId)
      issues.push({
        code: 'JOIN_WITHOUT_MATCHING_FORK',
        message: `「${label}」须与同一「并行分叉」节点成对：各入边分支应来自该分叉的并行出口`,
        nodeId: joinId
      })
    }
  }

  return issues
}
