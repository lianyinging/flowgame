import type { TinyflowData } from '@tinyflow-ai/ui'

/** 示例工作流：开始节点 → 结束节点 */
export const initialData: TinyflowData = {
  nodes: [
    {
      id: 'node_start',
      type: 'startNode',
      position: { x: 120, y: 220 },
      data: {
        title: '开始',
        description: '开始定义输入参数',
        expand: false
      }
    },
    {
      id: 'node_end',
      type: 'endNode',
      position: { x: 520, y: 220 },
      data: {
        title: '结束',
        description: '结束定义输出参数',
        expand: false
      }
    }
  ],
  edges: [
    {
      id: 'edge_start_end',
      source: 'node_start',
      target: 'node_end'
    }
  ],
  viewport: { x: 0, y: 0, zoom: 1 }
}
