import type { TinyflowData } from '@tinyflow-ai/ui'
import { START_API_NODE_TYPE } from './workflow-start-api-rules'

/** 将 Api接口开始 节点的 methodKey 同步为流程名称（与 Redis 键一致） */
export function syncMethodKeyInWorkflow(
  workflow: TinyflowData,
  flowName: string
): TinyflowData {
  const name = flowName.trim()
  if (!name || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0)
    return workflow

  const nodes = workflow.nodes.map((node) => {
    if (node.type !== START_API_NODE_TYPE)
      return node
    const data = {
      ...(typeof node.data === 'object' && node.data !== null ? node.data : {}),
      methodKey: name
    }
    return { ...node, data }
  })

  return { ...workflow, nodes }
}
