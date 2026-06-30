import type { Node } from '@xyflow/svelte'
import { resolveNodeBody, type FlowApi } from './if-node-canvas'
import {
  branchEdgeMapSignature,
  buildBranchEdgeSelect,
  listOutboundEdges,
  outboundEdgesSignature,
  readBranchEdgeMap,
  readEffectiveBranchEdgeMapFromMount,
  syncCanvasBranchEdgeSelects
} from './branch-edge-canvas'
import { ensureCanvasSection } from './node-canvas-sections'
import {
  SWITCH_ELSE_CASE_ID,
  appendSwitchCase,
  parseSwitchCases,
  removeSwitchCase,
  type SwitchCaseDef
} from './switch-cases'

export const SWITCH_NODE_CANVAS_CLASS = 'flowgame-switch-node-canvas'
const SWITCH_MATCH_SECTION_CLASS = 'flowgame-switch-match-section'
const CASE_MOUNT_CLASS = 'flowgame-switch-cases-canvas'
const ADD_CASE_MOUNT_CLASS = 'flowgame-switch-add-case-mount'

const flowByHost = new WeakMap<HTMLElement, FlowApi>()

function caseStructureSignature(cases: SwitchCaseDef[]) {
  return cases.map(c => c.id).join('|')
}

function switchBranchIds(cases: SwitchCaseDef[]) {
  return [...cases.map(c => c.id), SWITCH_ELSE_CASE_ID]
}

function buildCaseRow(
  host: HTMLElement,
  caseDef: SwitchCaseDef,
  index: number,
  nodeId: string,
  flow: FlowApi,
  branchEdgeMap: Record<string, string>,
  caseCount: number,
  readonly: boolean
) {
  const outbound = listOutboundEdges(flow, nodeId)
  const nodes = flow.getNodes?.() ?? []

  const row = document.createElement('div')
  row.className = 'flowgame-switch-canvas-row nopan nodrag'
  row.dataset.branchId = caseDef.id

  const label = document.createElement('div')
  label.className = 'flowgame-switch-canvas-row__label'
  label.textContent = `case ${index + 1}`

  const value = document.createElement('input')
  value.className = 'flowgame-switch-canvas-row__field nodrag'
  value.placeholder = '匹配值'
  value.value = caseDef.value ?? ''
  value.disabled = readonly
  value.addEventListener('click', e => e.stopPropagation())
  value.addEventListener('pointerdown', e => e.stopPropagation())
  value.addEventListener('input', () => {
    const live = flow.getNodes?.().find(n => n.id === nodeId)
    if (!live)
      return
    const data = (live.data ?? {}) as Record<string, unknown>
    const cases = Array.isArray(data.cases)
      ? [...(data.cases as SwitchCaseDef[])]
      : []
    const target = cases.find(c => c.id === caseDef.id)
    if (target) {
      target.value = value.value
      flow.updateNodeData(nodeId, { cases })
    }
  })

  const edgeSelect = buildBranchEdgeSelect(
    host,
    caseDef.id,
    nodeId,
    flow,
    outbound,
    nodes,
    branchEdgeMap,
    readonly
  )

  const actions = document.createElement('div')
  actions.className = 'flowgame-if-canvas-row__actions nopan nodrag'

  if (caseCount > 1 && !readonly) {
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
      const cases = parseSwitchCases(data)
      const next = removeSwitchCase(cases, caseDef.id)
      const map = readBranchEdgeMap(data)
      delete map[caseDef.id]
      flow.updateNodeData(nodeId, { cases: next, branchEdgeMap: map })
    })
    actions.appendChild(removeBtn)
  }
  else {
    const placeholder = document.createElement('div')
    placeholder.className = 'flowgame-if-canvas-row__remove-placeholder'
    actions.appendChild(placeholder)
  }

  row.append(label, value, edgeSelect, actions)
  return row
}

function buildElseRow(
  host: HTMLElement,
  nodeId: string,
  flow: FlowApi,
  branchEdgeMap: Record<string, string>,
  readonly: boolean
) {
  const outbound = listOutboundEdges(flow, nodeId)
  const nodes = flow.getNodes?.() ?? []

  const row = document.createElement('div')
  row.className = 'flowgame-switch-canvas-row flowgame-switch-canvas-row--else nopan nodrag'
  row.dataset.branchId = SWITCH_ELSE_CASE_ID

  const label = document.createElement('div')
  label.className = 'flowgame-switch-canvas-row__label'
  label.textContent = '否则'

  const field = document.createElement('div')
  field.className = 'flowgame-switch-canvas-row__field'
  field.textContent = '默认分支'

  const edgeSelect = buildBranchEdgeSelect(
    host,
    SWITCH_ELSE_CASE_ID,
    nodeId,
    flow,
    outbound,
    nodes,
    branchEdgeMap,
    readonly
  )

  const actions = document.createElement('div')
  actions.className = 'flowgame-if-canvas-row__actions nopan nodrag'
  const placeholder = document.createElement('div')
  placeholder.className = 'flowgame-if-canvas-row__remove-placeholder'
  actions.appendChild(placeholder)

  row.append(label, field, edgeSelect, actions)
  return row
}

function syncCaseFieldValues(mount: HTMLElement, cases: SwitchCaseDef[]) {
  for (const caseDef of cases) {
    const row = mount.querySelector<HTMLElement>(`[data-branch-id="${caseDef.id}"]`)
    const input = row?.querySelector('input')
    if (!input || document.activeElement === input)
      continue
    const next = caseDef.value ?? ''
    if (input.value !== next)
      input.value = next
  }
}

function ensureAddCaseButton(
  section: HTMLElement,
  mount: HTMLElement,
  node: Node,
  flow: FlowApi,
  readonly: boolean
) {
  let addMount = section.querySelector<HTMLElement>(`.${ADD_CASE_MOUNT_CLASS}`)
  if (!addMount) {
    addMount = document.createElement('div')
    addMount.className = `${ADD_CASE_MOUNT_CLASS} nopan nodrag`
    mount.insertAdjacentElement('afterend', addMount)
  }

  addMount.replaceChildren()
  if (readonly || !node.id)
    return

  const nodeId = node.id
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'flowgame-switch-add-case__btn'
  btn.textContent = '+ 添加 case'
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    const live = flow.getNodes?.().find(n => n.id === nodeId)
    if (!live)
      return
    const data = (live.data ?? {}) as Record<string, unknown>
    const cases = parseSwitchCases(data)
    flow.updateNodeData(nodeId, { cases: appendSwitchCase(cases) })
  })
  addMount.appendChild(btn)
}

export function syncSwitchNodeCanvas(
  host: HTMLElement,
  node: Node,
  flow: FlowApi,
  cases: SwitchCaseDef[],
  readonly = false
) {
  const body = resolveNodeBody(host)
  if (!node.id)
    return

  body.classList.add(SWITCH_NODE_CANVAS_CLASS)

  const { section, mount } = ensureCanvasSection(
    body,
    SWITCH_MATCH_SECTION_CLASS,
    '匹配分支',
    CASE_MOUNT_CLASS
  )

  body.querySelectorAll<HTMLElement>(`.${CASE_MOUNT_CLASS}`).forEach((el) => {
    if (el === mount)
      return
    const sectionEl = el.closest(`.${SWITCH_MATCH_SECTION_CLASS}`)
    if (sectionEl)
      sectionEl.remove()
    else
      el.remove()
  })

  const nodeData = (node.data ?? {}) as Record<string, unknown>
  const branchIds = switchBranchIds(cases)
  const outbound = listOutboundEdges(flow, node.id)
  const branchEdgeMap = readEffectiveBranchEdgeMapFromMount(mount, branchIds, nodeData, outbound)
  const structureSig = caseStructureSignature(cases)
  const outSig = outboundEdgesSignature(flow, node.id)

  if (mount.dataset.nodeId !== node.id || mount.dataset.structureSignature !== structureSig) {
    mount.dataset.nodeId = node.id
    mount.dataset.structureSignature = structureSig
    mount.dataset.outboundSignature = outSig
    mount.dataset.branchEdgeMapSignature = branchEdgeMapSignature(branchEdgeMap)
    mount.replaceChildren()
    cases.forEach((caseDef, index) => {
      mount.appendChild(buildCaseRow(
        host,
        caseDef,
        index,
        node.id!,
        flow,
        branchEdgeMap,
        cases.length,
        readonly
      ))
    })
    mount.appendChild(buildElseRow(host, node.id, flow, branchEdgeMap, readonly))
    ensureAddCaseButton(section, mount, node, flow, readonly)
    return
  }

  syncCanvasBranchEdgeSelects(mount, node.id, flow, branchIds, branchEdgeMap, readonly)
  syncCaseFieldValues(mount, cases)
  mount.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
    input.disabled = readonly
  })
  ensureAddCaseButton(section, mount, node, flow, readonly)
}

export function mountSwitchNodeCanvas(host: HTMLElement, node: Node, flow: FlowApi) {
  flowByHost.set(host, flow)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const data = (node.data ?? {}) as Record<string, unknown>
      syncSwitchNodeCanvas(host, node, flow, parseSwitchCases(data))
    })
  })
}

export function updateSwitchNodeCanvas(host: HTMLElement, node: Node) {
  const flow = flowByHost.get(host)
  if (!flow)
    return
  requestAnimationFrame(() => {
    const data = (node.data ?? {}) as Record<string, unknown>
    syncSwitchNodeCanvas(host, node, flow, parseSwitchCases(data))
  })
}
