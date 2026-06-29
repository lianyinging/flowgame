import type { TinyflowData } from '@tinyflow-ai/ui'
import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

export const START_TALK_NODE_TYPE = 'node_start_talk'
export const END_NODE_TYPE = 'endNode'
export const ASSISTANT_MESSAGE_OUTPUT_NAME = 'assistantMessage'

export interface TalkStartWorkflowIssue {
  code: string
  message: string
}

export function findStartTalkNodes(workflow: TinyflowData) {
  return (workflow.nodes ?? []).filter(n => n.type === START_TALK_NODE_TYPE)
}

export function hasStartTalkNode(workflow: TinyflowData) {
  return findStartTalkNodes(workflow).length > 0
}

function getEndNodeOutputDefs(workflow: TinyflowData) {
  const endNode = (workflow.nodes ?? []).find(n => n.type === END_NODE_TYPE)
  const data = endNode?.data
  if (!data || typeof data !== 'object')
    return []
  const outputDefs = (data as Record<string, unknown>).outputDefs
  return Array.isArray(outputDefs) ? outputDefs : []
}

function hasAssistantMessageOutput(workflow: TinyflowData) {
  return getEndNodeOutputDefs(workflow).some((item) => {
    if (!item || typeof item !== 'object')
      return false
    const name = String((item as Record<string, unknown>).name ?? '').trim()
    if (name !== ASSISTANT_MESSAGE_OUTPUT_NAME)
      return false
    const dataType = String((item as Record<string, unknown>).dataType ?? 'Object').trim()
    return dataType === 'Object' || dataType === ''
  })
}

/** 校验「对话开始」节点约束 */
export function validateTalkStartWorkflow(workflow: TinyflowData): TalkStartWorkflowIssue[] {
  const issues: TalkStartWorkflowIssue[] = []
  const edges = workflow.edges ?? []
  const talkNodes = findStartTalkNodes(workflow)

  if (talkNodes.length > 1) {
    issues.push({
      code: 'MULTIPLE_START_TALK',
      message: '流程中只能有一个「对话开始」节点'
    })
  }

  if (talkNodes.length === 0)
    return issues

  const talkId = talkNodes[0].id
  if (talkId && edges.some(e => e.target === talkId)) {
    issues.push({
      code: 'START_TALK_NOT_ENTRY',
      message: '「对话开始」只能作为流程起点，不能连接上游节点'
    })
  }

  if (!hasAssistantMessageOutput(workflow)) {
    issues.push({
      code: 'MISSING_ASSISTANT_MESSAGE',
      message: '配置了「对话开始」时，结束节点必须包含 Object 类型的 assistantMessage 输出'
    })
  }

  return issues
}

/**
 * 自动修正：
 * - 仅保留一个「对话开始」
 * - 移除指向「对话开始」的入边
 */
export function normalizeTalkStartWorkflow<T extends TinyflowData>(workflow: T): T {
  const talkNodes = findStartTalkNodes(workflow)
  if (talkNodes.length === 0)
    return workflow

  let nodes = [...(workflow.nodes ?? [])]
  let edges = [...(workflow.edges ?? [])]

  const primary = talkNodes[0]
  const primaryId = primary.id
  const extraTalkIds = new Set(
    talkNodes.slice(1).map(n => n.id).filter((id): id is string => Boolean(id))
  )

  if (extraTalkIds.size > 0) {
    nodes = nodes.filter(n => !n.id || !extraTalkIds.has(n.id))
    edges = edges.filter(e => !extraTalkIds.has(e.source) && !extraTalkIds.has(e.target))
  }

  if (primaryId)
    edges = edges.filter(e => e.target !== primaryId)

  return { ...workflow, nodes, edges }
}

export function isTalkStartWorkflowChanged(before: TinyflowData, after: TinyflowData) {
  return JSON.stringify(before.nodes) !== JSON.stringify(after.nodes)
    || JSON.stringify(before.edges) !== JSON.stringify(after.edges)
}

/** 隐藏「对话开始」节点的入线连接点 */
export function patchTalkStartNodeDom(canvas: HTMLElement | undefined, workflow: TinyflowData) {
  if (!canvas)
    return

  const talkIds = new Set(
    findStartTalkNodes(workflow).map(n => n.id).filter((id): id is string => Boolean(id))
  )
  if (talkIds.size === 0)
    return

  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return

  hostRoot.querySelectorAll('.svelte-flow__node').forEach((nodeEl) => {
    const id = nodeEl.getAttribute('data-id')
    if (!id || !talkIds.has(id))
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
