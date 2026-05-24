import type { TinyflowData } from '@tinyflow-ai/ui'

/** 节点卡片内折叠区（Tinyflow data.expand）默认收起 */
export function collapseAllNodePanels(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    const data = { ...(node.data ?? {}) }
    if (data.expand === false)
      return node
    changed = true
    return { ...node, data: { ...data, expand: false } }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}

/** 新建节点未带 expand 时补 false，不覆盖用户已手动展开的状态 */
export function ensureNodeExpandDefault(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    const data = node.data ?? {}
    if (data.expand !== undefined)
      return node
    changed = true
    return { ...node, data: { ...data, expand: false } }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}
