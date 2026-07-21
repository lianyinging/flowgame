import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { START_TALK_NODE_TYPE } from '../nodes/node-start-talk'
import {
  talkImgBase64ListParameter,
  talkMessageParameter,
  talkNodeOutputDefs,
  talkSessionIdParameter
} from '../nodes/talk-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function upsertNamedParam(
  params: Parameter[],
  name: string,
  factory: () => Parameter
) {
  if (params.some(p => p.name === name))
    return false
  params.push(factory())
  return true
}

/** 为「对话开始」节点补齐 message / sessionId / imgBase64List 输出 */
export function normalizeTalkStartNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== START_TALK_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    const raw = Array.isArray(data.outputDefs) ? [...(data.outputDefs as Parameter[])] : []
    if (!raw.length) {
      data.outputDefs = talkNodeOutputDefs.map(cloneParam)
      changed = true
      return { ...node, data }
    }

    const before = JSON.stringify(raw)
    upsertNamedParam(raw, 'message', () => cloneParam(talkMessageParameter))
    upsertNamedParam(raw, 'sessionId', () => cloneParam(talkSessionIdParameter))
    upsertNamedParam(raw, 'imgBase64List', () => cloneParam(talkImgBase64ListParameter))
    if (JSON.stringify(raw) !== before) {
      data.outputDefs = raw
      changed = true
      return { ...node, data }
    }
    return node
  })

  return changed ? { ...workflow, nodes: nextNodes } : workflow
}
