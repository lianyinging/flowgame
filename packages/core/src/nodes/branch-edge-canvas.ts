import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import { readEdgeBranch } from '../workflow/workflow-if-rules'
import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

export const FLOWGAME_ASSIGN_BRANCH_EDGE_EVENT = 'flowgame:assign-branch-edge'

export type AssignBranchEdgeDetail = {
  nodeId: string
  branchId: string
  edgeId: string
}

type FlowApi = ReturnType<typeof useSvelteFlow>

type CanvasEdge = {
  id?: string
  source?: string
  target?: string
  data?: Record<string, unknown>
}

export function readBranchEdgeMap(data: Record<string, unknown> | undefined): Record<string, string> {
  const raw = data?.branchEdgeMap
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return {}
  const map: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key === 'string' && typeof value === 'string' && value.trim())
      map[key] = value.trim()
  }
  return map
}

export function listOutboundEdges(flow: FlowApi, nodeId: string): CanvasEdge[] {
  return (flow.getEdges?.() ?? []).filter(e => e.source === nodeId)
}

export function resolveEdgeTargetLabel(nodes: Node[] | undefined, targetId?: string) {
  if (!targetId)
    return '未连接'
  const target = (nodes ?? []).find(n => n.id === targetId)
  if (!target)
    return targetId
  const title = (target.data as Record<string, unknown> | undefined)?.title
  return typeof title === 'string' && title.trim() ? title.trim() : (target.type || targetId)
}

export function selectedEdgeIdForBranch(
  branchId: string,
  outbound: CanvasEdge[],
  branchEdgeMap: Record<string, string>
) {
  const fromMap = branchEdgeMap[branchId]
  if (fromMap && outbound.some(e => e.id === fromMap))
    return fromMap
  return outbound.find(e => readEdgeBranch(e) === branchId)?.id ?? ''
}

function findFlowEditorCanvas(host: HTMLElement): HTMLElement | null {
  const root = host.getRootNode()
  if (root instanceof ShadowRoot) {
    let el: HTMLElement | null = root.host as HTMLElement
    while (el) {
      if (el.classList.contains('flowgram-page__canvas'))
        return el
      const nested = el.querySelector<HTMLElement>('.flowgram-page__canvas')
      if (nested)
        return nested
      el = el.parentElement
    }
  }
  return host.closest('.flowgram-page__canvas') as HTMLElement | null
}

export function dispatchAssignBranchEdge(host: HTMLElement, detail: AssignBranchEdgeDetail) {
  const canvas = findFlowEditorCanvas(host)
    ?? getTinyflowHostRoot(host)?.querySelector<HTMLElement>('.flowgram-page__canvas')
  const target = canvas ?? host
  target.dispatchEvent(new CustomEvent<AssignBranchEdgeDetail>(FLOWGAME_ASSIGN_BRANCH_EDGE_EVENT, {
    bubbles: true,
    composed: true,
    detail
  }))
}

export function fillBranchEdgeSelect(
  select: HTMLSelectElement,
  outbound: CanvasEdge[],
  nodes: Node[] | undefined,
  selectedEdgeId: string,
  emptyLabel: string
) {
  const resolvedId = selectedEdgeId && outbound.some(e => e.id === selectedEdgeId)
    ? selectedEdgeId
    : (select.value && outbound.some(e => e.id === select.value) ? select.value : '')
  const signature = `${outbound.map(e => e.id).join(',')}::${resolvedId}`
  if (select.dataset.edgeSelectSignature === signature)
    return

  select.dataset.edgeSelectSignature = signature
  select.replaceChildren()
  const empty = document.createElement('option')
  empty.value = ''
  empty.textContent = emptyLabel
  select.appendChild(empty)
  for (const edge of outbound) {
    if (!edge.id)
      continue
    const opt = document.createElement('option')
    opt.value = edge.id
    opt.textContent = `→ ${resolveEdgeTargetLabel(nodes, edge.target)}`
    select.appendChild(opt)
  }
  select.value = resolvedId
}

export function buildBranchEdgeSelect(
  host: HTMLElement,
  branchId: string,
  nodeId: string,
  flow: FlowApi,
  outbound: CanvasEdge[],
  nodes: Node[] | undefined,
  branchEdgeMap: Record<string, string>,
  readonly: boolean
) {
  const wrap = document.createElement('div')
  wrap.className = 'flowgame-if-canvas-row__edge nodrag'

  const select = document.createElement('select')
  select.className = 'flowgame-if-canvas-row__edge-select nodrag'
  select.disabled = readonly || !outbound.length
  fillBranchEdgeSelect(
    select,
    outbound,
    nodes,
    selectedEdgeIdForBranch(branchId, outbound, branchEdgeMap),
    outbound.length ? '无' : '—'
  )

  select.addEventListener('click', e => e.stopPropagation())
  select.addEventListener('pointerdown', e => e.stopPropagation())
  select.addEventListener('change', () => {
    dispatchAssignBranchEdge(host, {
      nodeId,
      branchId,
      edgeId: select.value
    })
  })

  wrap.appendChild(select)
  return wrap
}

/** 根据出边 edge.data.branch 与已有 branchEdgeMap 同步节点映射 */
export function syncIfNodeBranchEdgeMap(
  data: Record<string, unknown>,
  nodeId: string,
  edges: Array<{ id?: string, source?: string, data?: Record<string, unknown> }> | undefined,
  branchIds: string[]
) {
  const outbound = (edges ?? []).filter(e => e.source === nodeId)
  const prev = readBranchEdgeMap(data)
  const map: Record<string, string> = {}

  for (const branchId of branchIds) {
    const tagged = outbound.find(e => e.id && readEdgeBranch(e) === branchId)
    const prevEdgeId = prev[branchId]
    if (tagged?.id) {
      map[branchId] = tagged.id
    }
    else if (prevEdgeId && outbound.some(e => e.id === prevEdgeId)) {
      map[branchId] = prevEdgeId
    }
  }

  if (JSON.stringify(prev) === JSON.stringify(map))
    return false
  data.branchEdgeMap = map
  return true
}

export function branchEdgeMapSignature(map: Record<string, string>) {
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|')
}

export function outboundEdgesSignature(flow: FlowApi, nodeId: string) {
  return listOutboundEdges(flow, nodeId)
    .map(e => e.id)
    .filter(Boolean)
    .sort()
    .join('|')
}

export function readEffectiveBranchEdgeMapFromMount(
  mount: HTMLElement,
  branchIds: string[],
  nodeData: Record<string, unknown>,
  outbound: CanvasEdge[]
) {
  const map = { ...readBranchEdgeMap(nodeData) }
  for (const branchId of branchIds) {
    const row = mount.querySelector<HTMLElement>(`[data-branch-id="${branchId}"]`)
    const select = row?.querySelector<HTMLSelectElement>('.flowgame-if-canvas-row__edge-select')
    if (!select?.value || !outbound.some(e => e.id === select.value))
      continue
    map[branchId] = select.value
  }
  return map
}

export function syncCanvasBranchEdgeSelects(
  mount: HTMLElement,
  nodeId: string,
  flow: FlowApi,
  branchIds: string[],
  branchEdgeMap: Record<string, string>,
  readonly: boolean
) {
  const outbound = listOutboundEdges(flow, nodeId)
  const nodes = flow.getNodes?.() ?? []
  const emptyLabel = outbound.length ? '无' : '—'
  const effectiveMap = readEffectiveBranchEdgeMapFromMount(
    mount,
    branchIds,
    { branchEdgeMap } as Record<string, unknown>,
    outbound
  )
  const mapSig = branchEdgeMapSignature(effectiveMap)
  const outSig = outboundEdgesSignature(flow, nodeId)

  if (mount.dataset.branchEdgeMapSignature === mapSig && mount.dataset.outboundSignature === outSig)
    return

  mount.dataset.branchEdgeMapSignature = mapSig
  mount.dataset.outboundSignature = outSig

  for (const branchId of branchIds) {
    const row = mount.querySelector<HTMLElement>(`[data-branch-id="${branchId}"]`)
    const select = row?.querySelector<HTMLSelectElement>('.flowgame-if-canvas-row__edge-select')
    if (!select)
      continue
    select.disabled = readonly || !outbound.length
    if (document.activeElement === select)
      continue
    fillBranchEdgeSelect(
      select,
      outbound,
      nodes,
      selectedEdgeIdForBranch(branchId, outbound, effectiveMap),
      emptyLabel
    )
  }
}
