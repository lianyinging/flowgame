import type { TinyflowData } from '@tinyflow-ai/ui'
import {
  CODE_NODE_TYPE,
  DEFAULT_CODE_NODE_CODE,
  DEFAULT_CODE_NODE_ENGINE
} from '../inspector/code-node-inspector'

function ensureCodeNodeDefaults(data: Record<string, unknown>): boolean {
  let changed = false
  const code = data.code
  if (typeof code !== 'string' || !code.trim()) {
    data.code = DEFAULT_CODE_NODE_CODE
    changed = true
  }
  const engine = data.engine
  if (typeof engine !== 'string' || !engine.trim()) {
    data.engine = DEFAULT_CODE_NODE_ENGINE
    changed = true
  }
  return changed
}

/** 为动态代码节点补齐默认 JavaScript 示例与执行引擎 */
export function normalizeCodeNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== CODE_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) }
    if (!ensureCodeNodeDefaults(data))
      return node

    changed = true
    return { ...node, data }
  })

  if (!changed)
    return workflow

  return { ...workflow, nodes: nextNodes }
}
