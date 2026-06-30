import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import {
  buildBranchEdgeSelect,
  branchEdgeMapSignature,
  listOutboundEdges,
  outboundEdgesSignature,
  readBranchEdgeMap,
  readEffectiveBranchEdgeMapFromMount,
  syncCanvasBranchEdgeSelects
} from './branch-edge-canvas'
import { appendElseIfBranch, ifBranchTypeLabel, parseIfBranches, removeElseIfBranch, type IfBranchDef } from './if-branches'
import { ensureCanvasSection } from './node-canvas-sections'

export type FlowApi = ReturnType<typeof useSvelteFlow>

export const IF_NODE_CANVAS_CLASS = 'flowgame-if-node-canvas'
const IF_CONDITION_SECTION_CLASS = 'flowgame-if-condition-section'
const BRANCH_MOUNT_CLASS = 'flowgame-if-branches-canvas'
const ADD_ELSEIF_MOUNT_CLASS = 'flowgame-if-add-elseif-mount'

const flowByHost = new WeakMap<HTMLElement, FlowApi>()

export function resolveNodeBody(host: HTMLElement): HTMLElement {
  return (host.closest('.tf-node-wrapper-body') as HTMLElement | null) ?? host
}

function branchStructureSignature(branches: IfBranchDef[]) {
  return branches.map(b => `${b.id}:${b.type}`).join('|')
}

function branchIdsFromBranches(branches: IfBranchDef[]) {
  return branches.map(b => b.id)
}

function buildBranchRow(
  host: HTMLElement,
  branch: IfBranchDef,
  index: number,
  nodeId: string,
  flow: FlowApi,
  branchEdgeMap: Record<string, string>,
  readonly: boolean
) {
  const outbound = listOutboundEdges(flow, nodeId)
  const nodes = flow.getNodes?.() ?? []

  const row = document.createElement('div')
  row.className = 'flowgame-if-canvas-row nopan nodrag'
  row.dataset.branchId = branch.id

  const label = document.createElement('div')
  label.className = 'flowgame-if-canvas-row__label'
  label.textContent = ifBranchTypeLabel(branch.type, index)

  const field = document.createElement(branch.type === 'else' ? 'div' : 'textarea')
  field.className = 'flowgame-if-canvas-row__field nodrag'
  if (branch.type === 'else') {
    field.textContent = '默认分支'
  }
  else {
    const textarea = field as HTMLTextAreaElement
    textarea.rows = 2
    textarea.placeholder = index === 0 ? '{{msg}} === \'success\'' : '{{code}} === 500'
    textarea.value = branch.condition ?? ''
    textarea.disabled = readonly
    textarea.addEventListener('click', e => e.stopPropagation())
    textarea.addEventListener('pointerdown', e => e.stopPropagation())
    textarea.addEventListener('input', () => {
      const live = flow.getNodes?.().find(n => n.id === nodeId)
      if (!live)
        return
      const data = (live.data ?? {}) as Record<string, unknown>
      const branches = Array.isArray(data.branches)
        ? [...(data.branches as IfBranchDef[])]
        : []
      const target = branches.find(b => b.id === branch.id)
      if (target) {
        target.condition = textarea.value
        flow.updateNodeData(nodeId, { branches })
      }
    })
  }

  const edgeSelect = buildBranchEdgeSelect(
    host,
    branch.id,
    nodeId,
    flow,
    outbound,
    nodes,
    branchEdgeMap,
    readonly
  )

  const actions = document.createElement('div')
  actions.className = 'flowgame-if-canvas-row__actions nopan nodrag'

  if (branch.type === 'elseif' && !readonly) {
    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'flowgame-if-canvas-row__remove nodrag'
    removeBtn.title = '删除'
    removeBtn.setAttribute('aria-label', '删除')
    removeBtn.textContent = '×'
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const live = flow.getNodes?.().find(n => n.id === nodeId)
      if (!live)
        return
      const data = (live.data ?? {}) as Record<string, unknown>
      const branches = parseIfBranches(data)
      const next = removeElseIfBranch(branches, branch.id)
      const map = readBranchEdgeMap(data)
      delete map[branch.id]
      flow.updateNodeData(nodeId, { branches: next, branchEdgeMap: map })
    })
    actions.appendChild(removeBtn)
  }
  else {
    const placeholder = document.createElement('div')
    placeholder.className = 'flowgame-if-canvas-row__remove-placeholder'
    actions.appendChild(placeholder)
  }

  row.append(label, field, edgeSelect, actions)
  return row
}

function syncBranchFieldValues(mount: HTMLElement, branches: IfBranchDef[]) {
  for (const branch of branches) {
    if (branch.type === 'else')
      continue
    const row = mount.querySelector<HTMLElement>(`[data-branch-id="${branch.id}"]`)
    const textarea = row?.querySelector('textarea')
    if (!textarea || document.activeElement === textarea)
      continue
    const next = branch.condition ?? ''
    if (textarea.value !== next)
      textarea.value = next
  }
}

function ensureAddElseIfButton(
  section: HTMLElement,
  mount: HTMLElement,
  node: Node,
  flow: FlowApi,
  readonly: boolean
) {
  let addMount = section.querySelector<HTMLElement>(`.${ADD_ELSEIF_MOUNT_CLASS}`)
  if (!addMount) {
    addMount = document.createElement('div')
    addMount.className = `${ADD_ELSEIF_MOUNT_CLASS} nopan nodrag`
    mount.insertAdjacentElement('afterend', addMount)
  }

  addMount.replaceChildren()
  if (readonly || !node.id)
    return

  const nodeId = node.id
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'flowgame-if-add-elseif__btn'
  btn.textContent = '+ 添加否则如果'
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const live = flow.getNodes?.().find(n => n.id === nodeId)
    if (!live)
      return
    const data = (live.data ?? {}) as Record<string, unknown>
    const branches = parseIfBranches(data)
    flow.updateNodeData(nodeId, { branches: appendElseIfBranch(branches) })
  })
  addMount.appendChild(btn)
}

export function syncIfNodeCanvas(
  host: HTMLElement,
  node: Node,
  flow: FlowApi,
  branches: IfBranchDef[],
  readonly = false
) {
  const body = resolveNodeBody(host)
  if (!node.id)
    return

  body.classList.add(IF_NODE_CANVAS_CLASS)

  const { section, mount } = ensureCanvasSection(
    body,
    IF_CONDITION_SECTION_CLASS,
    '条件参数',
    BRANCH_MOUNT_CLASS
  )

  body.querySelectorAll<HTMLElement>(`.${BRANCH_MOUNT_CLASS}`).forEach((el) => {
    if (el === mount)
      return
    const sectionEl = el.closest(`.${IF_CONDITION_SECTION_CLASS}`)
    if (sectionEl)
      sectionEl.remove()
    else
      el.remove()
  })

  const nodeData = (node.data ?? {}) as Record<string, unknown>
  const branchIds = branchIdsFromBranches(branches)
  const outbound = listOutboundEdges(flow, node.id)
  const branchEdgeMap = readEffectiveBranchEdgeMapFromMount(mount, branchIds, nodeData, outbound)
  const structureSig = branchStructureSignature(branches)
  const outSig = outboundEdgesSignature(flow, node.id)

  if (mount.dataset.nodeId !== node.id || mount.dataset.structureSignature !== structureSig) {
    mount.dataset.nodeId = node.id
    mount.dataset.structureSignature = structureSig
    mount.dataset.outboundSignature = outSig
    mount.dataset.branchEdgeMapSignature = branchEdgeMapSignature(branchEdgeMap)
    mount.replaceChildren()
    branches.forEach((branch, index) => {
      mount.appendChild(buildBranchRow(host, branch, index, node.id!, flow, branchEdgeMap, readonly))
    })
    ensureAddElseIfButton(section, mount, node, flow, readonly)
    return
  }

  syncCanvasBranchEdgeSelects(mount, node.id, flow, branchIds, branchEdgeMap, readonly)

  syncBranchFieldValues(mount, branches)
  mount.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((textarea) => {
    textarea.disabled = readonly
  })
  ensureAddElseIfButton(section, mount, node, flow, readonly)
}

export function mountIfNodeCanvas(host: HTMLElement, node: Node, flow: FlowApi) {
  flowByHost.set(host, flow)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const data = (node.data ?? {}) as Record<string, unknown>
      syncIfNodeCanvas(host, node, flow, parseIfBranches(data))
    })
  })
}

export function updateIfNodeCanvas(host: HTMLElement, node: Node) {
  const flow = flowByHost.get(host)
  if (!flow)
    return
  requestAnimationFrame(() => {
    const data = (node.data ?? {}) as Record<string, unknown>
    syncIfNodeCanvas(host, node, flow, parseIfBranches(data))
  })
}
