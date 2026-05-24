import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import { buildKbBaseSelectOptions } from '@/api/flow-game/kb-collection'
import { listKbBasesCached } from '@/api/flow-game/qdrant'
import { buildKnowledgeBasePatch, readKnowledgeBaseFromData } from '../knowledge-node-inspector'

export const KNOWLEDGE_BASE_PICKER_CLASS = 'flowgame-kb-base-picker'

/** 与输入参数「参数名称」列一致的字段标签 */
export const KNOWLEDGE_BASE_FIELD_LABEL = '知识库'

export { invalidateKbBasesCache as invalidateKnowledgeBasePickerCache } from '@/api/flow-game/qdrant'

const CHEVRON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="m6 9 6 6 6-6"/></svg>'
const CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>'

type KbOption = { value: string, label: string }
type FlowApi = ReturnType<typeof useSvelteFlow>

interface KbTfSelectUi {
  heading: HTMLSpanElement
  menu: HTMLElement
}

const openMenus = new Set<HTMLElement>()

function closeAllKbMenus(except?: HTMLElement) {
  for (const menu of openMenus) {
    if (menu === except)
      continue
    menu.hidden = true
    menu.setAttribute('data-state', 'closed')
    openMenus.delete(menu)
  }
}

function setHeadingText(heading: HTMLSpanElement, options: KbOption[], selectedBase: string) {
  heading.replaceChildren()
  const match = options.find(o => o.value === selectedBase)
  if (match) {
    heading.textContent = match.label
    return
  }
  const span = document.createElement('span')
  span.className = 'tf-select-heading-span'
  span.textContent = options.length ? '请选择知识库' : '请先在「知识库配置」创建知识库'
  heading.appendChild(span)
}

function renderMenuItems(
  menu: HTMLElement,
  options: KbOption[],
  selectedBase: string,
  onPick: (value: string) => void
) {
  menu.replaceChildren()
  const selectable = options.filter(o => o.value)
  if (!selectable.length) {
    const empty = document.createElement('div')
    empty.className = 'tf-select-empty'
    empty.textContent = '暂无数据'
    menu.appendChild(empty)
    return
  }

  for (const opt of selectable) {
    const item = document.createElement('div')
    item.className = 'tf-select-option'
    item.setAttribute('role', 'option')
    item.dataset.value = opt.value

    const content = document.createElement('span')
    content.className = 'tf-select-option-content'
    content.textContent = opt.label
    item.appendChild(content)

    if (opt.value === selectedBase) {
      const selected = document.createElement('span')
      selected.className = 'tf-select-option-selected'
      selected.innerHTML = CHECK_SVG
      item.appendChild(selected)
    }

    item.addEventListener('click', (e) => {
      e.stopPropagation()
      onPick(opt.value)
      menu.hidden = true
      menu.setAttribute('data-state', 'closed')
      openMenus.delete(menu)
    })
    menu.appendChild(item)
  }
}

function createKbTfSelect(
  valueItem: HTMLElement,
  node: Node,
  flow: FlowApi
): KbTfSelectUi {
  const wrap = document.createElement('div')
  wrap.className = 'flowgame-kb-tf-select-wrap'

  const trigger = document.createElement('div')
  trigger.className = 'nopan nodrag tf-select flowgame-kb-tf-select'
  trigger.tabIndex = 0
  trigger.setAttribute('role', 'combobox')
  trigger.setAttribute('aria-expanded', 'false')

  const heading = document.createElement('span')
  heading.className = 'tf-select-heading'

  const icon = document.createElement('span')
  icon.className = 'tf-select-icon'
  icon.innerHTML = CHEVRON_SVG

  const menu = document.createElement('div')
  menu.className = 'tf-select-content flowgame-kb-tf-select-menu nopan nodrag nowheel'
  menu.hidden = true
  menu.setAttribute('data-state', 'closed')
  menu.setAttribute('role', 'listbox')

  trigger.append(heading, icon)
  wrap.append(trigger, menu)
  valueItem.appendChild(wrap)

  const onPick = (value: string) => {
    flow.updateNodeData(node.id, buildKnowledgeBasePatch(value))
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    const willOpen = menu.hidden
    closeAllKbMenus(willOpen ? menu : undefined)
    menu.hidden = !willOpen
    menu.setAttribute('data-state', willOpen ? 'open' : 'closed')
    trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
    if (willOpen)
      openMenus.add(menu)
    else
      openMenus.delete(menu)
  })

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      trigger.click()
    }
    if (e.key === 'Escape' && !menu.hidden) {
      menu.hidden = true
      menu.setAttribute('data-state', 'closed')
      trigger.setAttribute('aria-expanded', 'false')
      openMenus.delete(menu)
    }
  })

  wrap.addEventListener('flowgame-kb-sync', ((e: CustomEvent<{ options: KbOption[], selectedBase: string }>) => {
    const { options, selectedBase } = e.detail
    setHeadingText(heading, options, selectedBase)
    renderMenuItems(menu, options, selectedBase, onPick)
  }) as EventListener)

  return { heading, menu }
}

function getKbTfSelectUi(host: HTMLElement): KbTfSelectUi | null {
  const wrap = host.querySelector<HTMLElement>('.flowgame-kb-tf-select-wrap')
  if (!wrap)
    return null
  const heading = wrap.querySelector<HTMLSpanElement>('.tf-select-heading')
  const menu = wrap.querySelector<HTMLElement>('.flowgame-kb-tf-select-menu')
  if (!heading || !menu)
    return null
  return { heading, menu }
}

function dispatchKbSync(host: HTMLElement, options: KbOption[], selectedBase: string) {
  const wrap = host.querySelector<HTMLElement>('.flowgame-kb-tf-select-wrap')
  if (!wrap)
    return
  wrap.dispatchEvent(new CustomEvent('flowgame-kb-sync', {
    detail: { options, selectedBase },
    bubbles: false
  }))
}

async function syncPickerSelect(host: HTMLElement, node: Node) {
  if (!getKbTfSelectUi(host))
    return

  const data = (node.data ?? {}) as Record<string, unknown>
  const selectedBase = readKnowledgeBaseFromData(data)
  const bases = await listKbBasesCached()
  const options: KbOption[] = bases.length
    ? buildKbBaseSelectOptions(bases, selectedBase)
    : [{ value: '', label: '请先在「知识库配置」创建知识库' }]

  dispatchKbSync(host, options.filter(o => o.value), selectedBase)
}

function appendInputHeader(host: HTMLElement, text: string) {
  const el = document.createElement('div')
  el.className = 'input-header'
  el.textContent = text
  host.appendChild(el)
}

function appendNameLabel(item: HTMLElement, text: string) {
  const label = document.createElement('span')
  label.className = 'tf-param-name-label'
  label.textContent = text
  item.appendChild(label)
}

function ensurePickerShell(host: HTMLElement, node: Node, flow: FlowApi) {
  if (host.querySelector('.flowgame-kb-tf-select-wrap'))
    return

  host.dataset.flowgameKbPicker = '1'
  host.classList.add(KNOWLEDGE_BASE_PICKER_CLASS, 'input-container')

  appendInputHeader(host, '参数名称')
  appendInputHeader(host, '参数值')
  appendInputHeader(host, '')

  const nameItem = document.createElement('div')
  nameItem.className = 'input-item'
  appendNameLabel(nameItem, KNOWLEDGE_BASE_FIELD_LABEL)

  const valueItem = document.createElement('div')
  valueItem.className = 'input-item'
  createKbTfSelect(valueItem, node, flow)

  const moreItem = document.createElement('div')
  moreItem.className = 'input-item tf-kb-input-container__more'
  moreItem.setAttribute('aria-hidden', 'true')

  host.append(nameItem, valueItem, moreItem)
}

let documentCloseBound = false

function ensureDocumentCloseHandler() {
  if (documentCloseBound)
    return
  documentCloseBound = true
  document.addEventListener('click', () => closeAllKbMenus())
}

export async function mountKnowledgeBasePicker(
  host: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  ensureDocumentCloseHandler()
  ensurePickerShell(host, node, flow)
  await syncPickerSelect(host, node)
}

export function updateKnowledgeBasePicker(host: HTMLElement, node: Node) {
  void syncPickerSelect(host, node)
}
