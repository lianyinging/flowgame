import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import {
  createCanvasSectionHeading,
  findParametersInputContainer
} from './node-canvas-sections'
import {
  DEFAULT_STATE_MACHINE_MODE,
  STATE_MACHINE_MODES,
  readStateMachineMode,
  type StateMachineMode
} from './state-machine-modes'
import { stateMachineBuiltinParamNames } from './state-node-builtin-params'
import {
  STATE_MACHINE_DEFAULT_PARAMS_TITLE,
  STATE_MACHINE_MODE_SECTION_TITLE
} from './state-node-section-headings'
import { mergeStateParametersForModeChange } from './state-node-builtin-params'
import type { FlowParameter } from '../inspector/node-inspector-config'
import { syncStateMachineCanvasFormVisibility } from './state-node-form-fields'

export const STATE_MACHINE_CANVAS_CLASS = 'flowgame-state-machine-canvas'
const MODE_MOUNT_CLASS = 'flowgame-state-mode-mount'
const MODE_HEADING_CLASS = 'flowgame-state-mode-section-heading'
const DEFAULT_PARAMS_HEADING_CLASS = 'flowgame-state-default-params-heading'
const CUSTOM_CONTAINER_CLASS = 'flowgame-state-custom-params'
const DEFAULT_CONTAINER_CLASS = 'flowgame-state-default-params'
const SOURCE_HIDDEN_CLASS = 'flowgame-state-source-params-hidden'

type FlowApi = ReturnType<typeof useSvelteFlow>

const flowByHost = new WeakMap<HTMLElement, FlowApi>()
const observerByBody = new WeakMap<HTMLElement, MutationObserver>()
const layoutSigByBody = new WeakMap<HTMLElement, string>()
let syncScheduled = false
let splitting = false

function isEditingInsideBody(body: HTMLElement): boolean {
  const active = document.activeElement
  if (!active || !(active instanceof HTMLElement) || !body.contains(active))
    return false
  const tag = active.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable
}

function computeLayoutSignature(node: Node): string {
  const data = (node.data ?? {}) as Record<string, unknown>
  const mode = readStateMachineMode(data)
  const builtin = stateMachineBuiltinParamNames(mode)
  const params = Array.isArray(data.parameters) ? data.parameters as FlowParameter[] : []
  const parts = params.map((p) => {
    const name = (p.name ?? '').trim()
    return `${name}:${builtin.has(name) ? 'b' : 'c'}`
  })
  return `${mode}|${parts.join(',')}`
}

function resolveMountRoot(host: HTMLElement): HTMLElement {
  return (host.closest('.tf-node-wrapper-body') as HTMLElement | null) ?? host
}

function findInputParametersHeading(body: HTMLElement): HTMLElement | null {
  for (const heading of body.querySelectorAll('.heading')) {
    if (
      heading.classList.contains(MODE_HEADING_CLASS)
      || heading.classList.contains(DEFAULT_PARAMS_HEADING_CLASS)
    )
      continue
    const text = (heading.textContent ?? '').trim()
    if (text.includes('输入参数'))
      return heading as HTMLElement
  }
  return null
}

function findNativeParametersSource(body: HTMLElement): HTMLElement | null {
  for (const el of body.querySelectorAll<HTMLElement>('.input-container')) {
    if (el.classList.contains(CUSTOM_CONTAINER_CLASS))
      continue
    if (el.classList.contains(DEFAULT_CONTAINER_CLASS))
      continue
    return el
  }
  return findParametersInputContainer(body)
}

function readParamNameFromNameItem(nameItem: HTMLElement): string {
  const label = nameItem.querySelector('.tf-param-name-label')
  if (label)
    return (label.textContent ?? '').trim()
  const input = nameItem.querySelector('input')
  if (input)
    return (input.value ?? input.getAttribute('value') ?? '').trim()
  return (nameItem.textContent ?? '').trim()
}

function cloneInputHeaders(source: HTMLElement, target: HTMLElement) {
  target.querySelectorAll(':scope > .input-header').forEach(el => el.remove())
  source.querySelectorAll(':scope > .input-header').forEach((header) => {
    target.appendChild(header.cloneNode(true))
  })
}

function createParamContainer(className: string, headerSource: HTMLElement): HTMLElement {
  const el = document.createElement('div')
  el.className = `input-container tf-kb-input-container ${className} nopan nodrag`
  cloneInputHeaders(headerSource, el)
  return el
}

function parametersForMode(mode: StateMachineMode, existing?: FlowParameter[]) {
  return mergeStateParametersForModeChange(existing, mode)
}

function ensureSectionHeadingsAndContainers(body: HTMLElement, source: HTMLElement) {
  const inputHeading = findInputParametersHeading(body)
  if (!inputHeading)
    return null

  let modeHeading = body.querySelector<HTMLElement>(`.${MODE_HEADING_CLASS}`)
  if (!modeHeading) {
    modeHeading = createCanvasSectionHeading(STATE_MACHINE_MODE_SECTION_TITLE)
    modeHeading.classList.add(MODE_HEADING_CLASS)
  }
  inputHeading.insertAdjacentElement('beforebegin', modeHeading)

  let defaultHeading = body.querySelector<HTMLElement>(`.${DEFAULT_PARAMS_HEADING_CLASS}`)
  if (!defaultHeading) {
    defaultHeading = createCanvasSectionHeading(STATE_MACHINE_DEFAULT_PARAMS_TITLE)
    defaultHeading.classList.add(DEFAULT_PARAMS_HEADING_CLASS)
  }

  let customContainer = body.querySelector<HTMLElement>(`.${CUSTOM_CONTAINER_CLASS}`)
  if (!customContainer)
    customContainer = createParamContainer(CUSTOM_CONTAINER_CLASS, source)

  let defaultContainer = body.querySelector<HTMLElement>(`.${DEFAULT_CONTAINER_CLASS}`)
  if (!defaultContainer)
    defaultContainer = createParamContainer(DEFAULT_CONTAINER_CLASS, source)

  inputHeading.insertAdjacentElement('afterend', customContainer)
  customContainer.insertAdjacentElement('afterend', defaultHeading)
  defaultHeading.insertAdjacentElement('afterend', defaultContainer)

  return { inputHeading, modeHeading, defaultHeading, customContainer, defaultContainer }
}

function ensureModeMount(
  body: HTMLElement,
  modeHeading: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  let mount = body.querySelector<HTMLElement>(`.${MODE_MOUNT_CLASS}`)
  if (!mount) {
    mount = document.createElement('div')
    mount.className = `${MODE_MOUNT_CLASS} nopan nodrag`

    const select = document.createElement('select')
    select.className = 'flowgame-state-mode-mount__select nodrag'
    for (const opt of STATE_MACHINE_MODES) {
      const option = document.createElement('option')
      option.value = opt.value
      option.textContent = opt.label
      select.appendChild(option)
    }

    select.addEventListener('click', e => e.stopPropagation())
    select.addEventListener('pointerdown', e => e.stopPropagation())
    select.addEventListener('change', () => {
      const value = select.value as StateMachineMode
      const live = flow.getNodes?.().find(n => n.id === node.id)
      if (!live)
        return
      const data = (live.data ?? {}) as Record<string, unknown>
      const existing = Array.isArray(data.parameters) ? data.parameters as FlowParameter[] : []
      flow.updateNodeData(node.id, {
        mode: value,
        parameters: parametersForMode(value, existing)
      })
    })

    mount.appendChild(select)
  }

  if (modeHeading.nextElementSibling !== mount)
    modeHeading.insertAdjacentElement('afterend', mount)

  const select = mount.querySelector<HTMLSelectElement>('select')
  if (!select)
    return

  const mode = readStateMachineMode((node.data ?? {}) as Record<string, unknown>)
  if (document.activeElement !== select)
    select.value = mode || DEFAULT_STATE_MACHINE_MODE

  mount.dataset.flowgameStateNodeId = node.id
}

function resetRowsToSource(
  source: HTMLElement,
  customContainer: HTMLElement,
  defaultContainer: HTMLElement
) {
  for (const container of [customContainer, defaultContainer]) {
    const items = Array.from(container.querySelectorAll(':scope > .input-item'))
    for (const item of items)
      source.appendChild(item)
  }
}

function splitParameterRows(
  body: HTMLElement,
  node: Node,
  customContainer: HTMLElement,
  defaultContainer: HTMLElement,
  source: HTMLElement
) {
  if (splitting)
    return

  if (isEditingInsideBody(body))
    return

  const sig = computeLayoutSignature(node)
  const prevSig = layoutSigByBody.get(body)
  const sourceHasRows = source.querySelector(':scope > .input-item') != null
  const sourceWasSplit = source.classList.contains(SOURCE_HIDDEN_CLASS)
  const needsResplit = prevSig !== sig || (sourceWasSplit && sourceHasRows)
  if (!needsResplit)
    return

  splitting = true
  try {
    resetRowsToSource(source, customContainer, defaultContainer)

    const mode = readStateMachineMode((node.data ?? {}) as Record<string, unknown>)
    const builtinNames = stateMachineBuiltinParamNames(mode)

    const rowItems = Array.from(source.querySelectorAll(':scope > .input-item')) as HTMLElement[]
    const rows: HTMLElement[][] = []
    for (let i = 0; i + 2 < rowItems.length; i += 3)
      rows.push([rowItems[i], rowItems[i + 1], rowItems[i + 2]])

    for (const row of rows) {
      const name = readParamNameFromNameItem(row[0])
      const dest = name && builtinNames.has(name) ? defaultContainer : customContainer
      for (const cell of row)
        dest.appendChild(cell)
    }

    customContainer.style.display = customContainer.querySelector(':scope > .input-item')
      ? ''
      : 'none'

    source.classList.add(SOURCE_HIDDEN_CLASS)
    source.style.display = 'none'
    layoutSigByBody.set(body, sig)
  }
  finally {
    splitting = false
  }
}

function syncStateMachineCanvas(host: HTMLElement, node: Node, flow: FlowApi) {
  const body = resolveMountRoot(host)
  body.classList.add(STATE_MACHINE_CANVAS_CLASS)

  const source = findNativeParametersSource(body)
  if (!source)
    return

  const sections = ensureSectionHeadingsAndContainers(body, source)
  if (!sections)
    return

  ensureModeMount(body, sections.modeHeading, node, flow)
  splitParameterRows(body, node, sections.customContainer, sections.defaultContainer, source)
  syncStateMachineCanvasFormVisibility(body, (node.data ?? {}) as Record<string, unknown>)
}

function scheduleSync(host: HTMLElement, node: Node, flow: FlowApi) {
  if (syncScheduled)
    return
  const body = resolveMountRoot(host)
  if (isEditingInsideBody(body))
    return
  syncScheduled = true
  requestAnimationFrame(() => {
    syncScheduled = false
    syncStateMachineCanvas(host, node, flow)
  })
}

function ensureBlurResync(body: HTMLElement, host: HTMLElement, node: Node, flow: FlowApi) {
  const key = 'flowgameStateBlurBound'
  if ((body as HTMLElement & { [key]?: boolean })[key])
    return
  ;(body as HTMLElement & { [key]?: boolean })[key] = true
  body.addEventListener('focusout', (event) => {
    const related = event.relatedTarget
    if (related instanceof HTMLElement && body.contains(related))
      return
    scheduleSync(host, node, flow)
  })
}

function observeBody(host: HTMLElement, node: Node, flow: FlowApi) {
  const body = resolveMountRoot(host)
  if (observerByBody.has(body))
    return

  const observer = new MutationObserver(() => {
    if (splitting)
      return
    if (isEditingInsideBody(body))
      return
    scheduleSync(host, node, flow)
  })
  observer.observe(body, { childList: true, subtree: true })
  observerByBody.set(body, observer)
}

export function mountStateMachineCanvasControls(
  host: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  flowByHost.set(host, flow)
  const body = resolveMountRoot(host)
  ensureBlurResync(body, host, node, flow)
  observeBody(host, node, flow)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncStateMachineCanvas(host, node, flow)
    })
  })
}

export function updateStateMachineCanvasControls(host: HTMLElement, node: Node) {
  const flow = flowByHost.get(host)
  if (!flow)
    return
  scheduleSync(host, node, flow)
}
