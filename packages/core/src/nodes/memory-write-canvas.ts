import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import {
  appendMemoryWriteGroup,
  contextKeyParamName,
  defaultMemoryWriteParameters,
  parseMemoryWriteGroups
} from '../workflow/memory-write-groups'
import type { FlowParameter } from '../inspector/node-inspector-config'

/** 画布仅补充「添加记忆组」；引用下拉与记忆读取一致，由 Tinyflow 内置 parameters 渲染 */
export const MEMORY_WRITE_CANVAS_CLASS = 'flowgame-memory-write-canvas'
const ADD_GROUP_MOUNT_CLASS = 'flowgame-mw-add-group-mount'

type FlowApi = ReturnType<typeof useSvelteFlow>

const flowByHost = new WeakMap<HTMLElement, FlowApi>()

function readParameters(node: Node): FlowParameter[] {
  const data = (node.data ?? {}) as Record<string, unknown>
  const raw = data.parameters
  if (Array.isArray(raw) && raw.length)
    return JSON.parse(JSON.stringify(raw)) as FlowParameter[]
  return defaultMemoryWriteParameters()
}

function resolveMountRoot(host: HTMLElement): HTMLElement {
  return (host.closest('.tf-node-wrapper-body') as HTMLElement | null) ?? host
}

/** 定位 Tinyflow 渲染的「输入参数」input-container（与记忆读取同一套） */
function findParametersInputContainer(body: HTMLElement): HTMLElement | null {
  for (const heading of body.querySelectorAll('.heading')) {
    const text = (heading.textContent ?? '').trim()
    if (!text.includes('输入参数'))
      continue
    let el = heading.nextElementSibling
    while (el) {
      if (el instanceof HTMLElement && el.classList.contains('input-container'))
        return el
      if (
        el instanceof HTMLElement
        && (el.classList.contains('heading') || el.classList.contains('setting-item'))
      )
        break
      el = el.nextElementSibling
    }
  }
  return body.querySelector<HTMLElement>('.input-container')
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

/** 在 Tinyflow 原生参数表各记忆组之间插入虚线分隔（第 2 组起） */
function ensureGroupDividers(body: HTMLElement, params: FlowParameter[]) {
  const container = findParametersInputContainer(body)
  if (!container)
    return

  container.querySelectorAll('.flowgame-mw-group-divider').forEach(el => el.remove())

  const groups = parseMemoryWriteGroups(params)
  if (groups.length <= 1)
    return

  const nameItems: HTMLElement[] = []
  const inputItems = container.querySelectorAll(':scope > .input-item')
  for (let i = 0; i < inputItems.length; i += 3)
    nameItems.push(inputItems[i] as HTMLElement)

  for (let gi = 1; gi < groups.length; gi++) {
    const group = groups[gi]
    const ctxName = contextKeyParamName(group.suffix)
    let anchor =
      nameItems.find(el => readParamNameFromNameItem(el) === ctxName)
      ?? nameItems[gi * 2]
    if (!anchor)
      continue

    const divider = document.createElement('div')
    divider.className = 'flowgame-mw-group-divider nopan nodrag'
    divider.setAttribute('role', 'separator')
    divider.textContent = `记忆组 ${gi + 1}`
    container.insertBefore(divider, anchor)
  }
}

function ensureAddGroupButton(body: HTMLElement, node: Node, flow: FlowApi) {
  const paramsContainer = findParametersInputContainer(body)
  if (!paramsContainer)
    return

  let mount = body.querySelector<HTMLElement>(`.${ADD_GROUP_MOUNT_CLASS}`)
  if (!mount) {
    mount = document.createElement('div')
    mount.className = `${ADD_GROUP_MOUNT_CLASS} nopan nodrag`
    paramsContainer.insertAdjacentElement('afterend', mount)
  }

  if (mount.dataset.flowgameMwNodeId === node.id && mount.querySelector('button'))
    return

  mount.dataset.flowgameMwNodeId = node.id
  mount.replaceChildren()

  const addBtn = document.createElement('button')
  addBtn.type = 'button'
  addBtn.className = 'flowgame-memory-write-add-group__btn'
  addBtn.textContent = '+ 添加记忆组'
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const live = flow.getNodes?.().find(n => n.id === node.id)
    if (!live)
      return
    const next = appendMemoryWriteGroup(readParameters(live))
    flow.updateNodeData(node.id, { parameters: next })
  })
  mount.appendChild(addBtn)
}

function syncMemoryWriteCanvas(host: HTMLElement, node: Node, flow: FlowApi) {
  const body = resolveMountRoot(host)
  const params = readParameters(node)
  if (!parseMemoryWriteGroups(params).length) {
    flow.updateNodeData(node.id, { parameters: defaultMemoryWriteParameters() })
    return
  }
  body.classList.add(MEMORY_WRITE_CANVAS_CLASS)
  ensureGroupDividers(body, params)
  ensureAddGroupButton(body, node, flow)
}

export function mountMemoryWriteCanvasControls(
  host: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  flowByHost.set(host, flow)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncMemoryWriteCanvas(host, node, flow)
    })
  })
}

export function updateMemoryWriteCanvasControls(host: HTMLElement, node: Node) {
  const flow = flowByHost.get(host)
  if (!flow)
    return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncMemoryWriteCanvas(host, node, flow)
    })
  })
}

export function teardownMemoryWriteCanvas(_host: HTMLElement) {
  // 无自定义下拉，无需清理
}
