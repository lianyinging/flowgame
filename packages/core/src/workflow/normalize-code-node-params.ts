import type { TinyflowData } from '@tinyflow-ai/ui'
import {
  CODE_NODE_TYPE,
  defaultCodeForEngine,
  normalizeCodeNodeEngine
} from '../inspector/code-node-inspector'

function ensureCodeNodeDefaults(data: Record<string, unknown>): boolean {
  let changed = false
  const engine = normalizeCodeNodeEngine(data.engine)
  if (data.engine !== engine) {
    data.engine = engine
    changed = true
  }
  const code = data.code
  if (typeof code !== 'string' || !code.trim()) {
    data.code = defaultCodeForEngine(engine)
    changed = true
  }
  return changed
}

/** 为动态代码节点补齐默认示例与执行引擎（仅 js / python） */
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
