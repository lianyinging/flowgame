import type { Tinyflow, TinyflowData } from '@tinyflow-ai/ui'

/** Tinyflow 内部 Svelte Flow 实例（未在类型中导出，编辑节点 data 时用，避免 setData 整页重建） */
export type TinyflowFlowApi = {
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void
  updateNode?: (nodeId: string, patch: Record<string, unknown>) => void
  toObject: () => TinyflowData
  getNodes?: () => TinyflowData['nodes']
  getEdges?: () => TinyflowData['edges']
  getViewport?: () => TinyflowData['viewport']
  zoomIn?: () => void
  zoomOut?: () => void
  fitView?: (options?: { padding?: number }) => void
  getZoom?: () => number
  setZoom?: (zoom: number, options?: { duration?: number }) => void | Promise<boolean>
}

/** 画布上仅高亮指定节点（用于侧栏打开时的选中态） */
export function selectCanvasNode(instance: Tinyflow | undefined, nodeId: string | null) {
  const api = getTinyflowFlowApi(instance)
  if (!api?.getNodes || !api.updateNode)
    return
  for (const node of api.getNodes() ?? []) {
    if (!node.id)
      continue
    api.updateNode(node.id, { selected: nodeId ? node.id === nodeId : false })
  }
}

/** 去掉 Vue/Svelte 响应式 Proxy，避免 structuredClone / JSON 保存失败 */
export function clonePlainWorkflow<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * 从画布读取可序列化工作流。
 * getData/toObject 内部用 structuredClone，节点 data 含 Proxy 时会抛 DOMException。
 */
export function getWorkflowFromTinyflow(
  instance?: Tinyflow,
  fallback?: TinyflowData
): TinyflowData {
  const api = getTinyflowFlowApi(instance)
  if (api?.getNodes && api.getEdges && api.getViewport) {
    try {
      return clonePlainWorkflow({
        nodes: api.getNodes(),
        edges: api.getEdges(),
        viewport: api.getViewport()
      })
    }
    catch {
      // continue
    }
  }

  if (instance) {
    try {
      return clonePlainWorkflow(instance.getData())
    }
    catch {
      // continue
    }
  }

  return clonePlainWorkflow(fallback ?? { nodes: [], edges: [] })
}

export function getTinyflowFlowApi(instance?: Tinyflow): TinyflowFlowApi | null {
  if (!instance)
    return null
  const internal = instance as unknown as { svelteFlowInstance?: TinyflowFlowApi }
  return internal.svelteFlowInstance ?? null
}

export function getCanvasZoomPercent(instance?: Tinyflow): number {
  const api = getTinyflowFlowApi(instance)
  const zoom = api?.getZoom?.() ?? api?.getViewport?.()?.zoom ?? 1
  return Math.round(zoom * 100)
}

export function canvasZoomIn(instance?: Tinyflow) {
  getTinyflowFlowApi(instance)?.zoomIn?.()
}

export function canvasZoomOut(instance?: Tinyflow) {
  getTinyflowFlowApi(instance)?.zoomOut?.()
}

export function canvasFitView(instance?: Tinyflow) {
  getTinyflowFlowApi(instance)?.fitView?.({ padding: 0.15 })
}

export function canvasSetZoomPercent(instance: Tinyflow | undefined, percent: number) {
  const api = getTinyflowFlowApi(instance)
  api?.setZoom?.(percent / 100, { duration: 200 })
}

/** 将归一化后的节点 data 增量同步到画布（不触发 setData 销毁重建） */
export function syncWorkflowNodesToCanvas(
  instance: Tinyflow | undefined,
  before: TinyflowData,
  after: TinyflowData
) {
  const api = getTinyflowFlowApi(instance)
  if (!api)
    return

  const prevDataById = new Map(
    (before.nodes ?? []).map(n => [n.id, JSON.stringify(n.data ?? {})])
  )

  for (const node of after.nodes ?? []) {
    if (!node.id)
      continue
    const serializedData = JSON.stringify(node.data ?? {})
    if (prevDataById.get(node.id) === serializedData)
      continue
    if (node.data && typeof node.data === 'object')
      api.updateNodeData(node.id, clonePlainWorkflow(node.data) as Record<string, unknown>)
  }
}
