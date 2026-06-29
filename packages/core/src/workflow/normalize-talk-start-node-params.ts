import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { START_TALK_NODE_TYPE } from '../nodes/node-start-talk'
import { talkNodeOutputDefs } from '../nodes/talk-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

/** 为「对话开始」节点补齐 message / sessionId 输出（画布引用下拉与变量树依赖 outputDefs） */
export function normalizeTalkStartNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== START_TALK_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    const raw = data.outputDefs
    if (Array.isArray(raw) && raw.length > 0)
      return node

    data.outputDefs = talkNodeOutputDefs.map(cloneParam)
    changed = true
    return { ...node, data }
  })

  return changed ? { ...workflow, nodes: nextNodes } : workflow
}
