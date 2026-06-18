import type { FlowGameNodeCategory } from '../nodes/node-category-registry'
import { getSortedNodeCategories, resolveNodeCategory } from '../nodes/node-category-registry'
import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

const MOUNT_CLASS = 'flowgame-node-category-mount'
const SCROLL_CLASS = 'flowgame-node-category-scroll'
const GROUP_CLASS = 'flowgame-node-category-group'
const COLLAPSED_CLASS = 'flowgame-node-category-group--collapsed'
const TITLE_BTN_CLASS = 'flowgame-node-category-title-btn'
const CHEVRON_CLASS = 'flowgame-node-category-chevron'
const LIST_CLASS = 'flowgame-node-category-list'
const STYLE_ID = 'flowgame-node-category-style'
const OBSERVER_ATTR = 'data-flowgame-node-category-observer'
const COLLAPSED_STORAGE_KEY = 'flowgame:node-category-collapsed'

const CHEVRON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M9.70711 8.29289C9.31658 7.90237 8.68342 7.90237 8.29289 8.29289C7.90237 8.68342 7.90237 9.31658 8.29289 9.70711L12 13.4142L15.7071 9.70711C16.0976 9.31658 16.6834 9.31658 17.0739 9.70711C17.4644 10.0976 17.4644 10.6834 17.0739 11.0739L12.7071 15.4408C12.3166 15.8313 11.6834 15.8313 11.2929 15.4408L6.92608 11.0739C6.53555 10.6834 6.53555 10.0976 6.92608 9.70711C7.3166 9.31658 7.90237 9.31658 8.29289 9.70711L9.70711 8.29289Z"/></svg>'

const CATEGORY_STYLES = `
.${SCROLL_CLASS} {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}
.${MOUNT_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding-bottom: 4px;
}
.${GROUP_CLASS}:not(:last-child) {
  margin-bottom: 4px;
}
.${TITLE_BTN_CLASS} {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
  margin: 0;
  padding: 6px 8px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.45);
  text-align: left;
  user-select: none;
  border-radius: 6px;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.${TITLE_BTN_CLASS}:hover {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.65);
}
.${CHEVRON_CLASS} {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  opacity: 0.55;
  transition: transform 0.15s ease;
}
.${GROUP_CLASS}.${COLLAPSED_CLASS} .${CHEVRON_CLASS} {
  transform: rotate(-90deg);
}
.${GROUP_CLASS}.${COLLAPSED_CLASS} .${LIST_CLASS} {
  display: none;
}
.${LIST_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.tf-toolbar-container-base [data-node-type] {
  font-size: 15px !important;
  line-height: 1.5 !important;
}
.tf-toolbar-container-base [data-node-type] span {
  font-size: inherit !important;
}
`

function readCollapsedState(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(COLLAPSED_STORAGE_KEY)
    if (!raw)
      return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function writeCollapsedState(state: Record<string, boolean>) {
  try {
    sessionStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // ignore quota / private mode
  }
}

function isCategoryCollapsed(categoryId: string): boolean {
  return Boolean(readCollapsedState()[categoryId])
}

function setCategoryCollapsed(categoryId: string, collapsed: boolean) {
  const state = readCollapsedState()
  if (collapsed)
    state[categoryId] = true
  else
    delete state[categoryId]
  writeCollapsedState(state)
}

function injectCategoryStyles(hostRoot: ShadowRoot | HTMLElement) {
  const existing = hostRoot instanceof ShadowRoot
    ? hostRoot.getElementById(STYLE_ID)
    : hostRoot.querySelector<HTMLStyleElement>(`#${STYLE_ID}`)
  if (existing) {
    existing.textContent = CATEGORY_STYLES
    return
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CATEGORY_STYLES
  hostRoot.appendChild(style)
}

function collectToolbarNodeButtons(baseEl: HTMLElement): HTMLElement[] {
  return Array.from(baseEl.querySelectorAll('[data-node-type]')) as HTMLElement[]
}

function needsCategoryLayout(baseEl: HTMLElement): boolean {
  const buttons = collectToolbarNodeButtons(baseEl)
  if (!buttons.length)
    return false
  const mount = baseEl.querySelector(`.${MOUNT_CLASS}`)
  if (!mount)
    return true
  return buttons.some(btn => !mount.contains(btn))
}

function isNodeToolbarButton(el: Element): boolean {
  return el.hasAttribute('data-node-type')
    || Boolean(el.querySelector('[data-node-type]'))
}

function ensureCategoryShell(baseEl: HTMLElement): HTMLElement {
  baseEl.querySelector('.flowgame-node-category-actions')?.remove()

  let scroll = baseEl.querySelector(`.${SCROLL_CLASS}`) as HTMLElement | null
  if (!scroll) {
    scroll = document.createElement('div')
    scroll.className = SCROLL_CLASS
    baseEl.appendChild(scroll)
  }

  let mount = scroll.querySelector(`.${MOUNT_CLASS}`) as HTMLElement | null
  if (!mount) {
    mount = baseEl.querySelector(`.${MOUNT_CLASS}`) as HTMLElement | null
    if (!mount) {
      mount = document.createElement('div')
      mount.className = MOUNT_CLASS
    }
    scroll.appendChild(mount)
  }
  else if (mount.parentElement !== scroll) {
    scroll.appendChild(mount)
  }

  for (const child of Array.from(baseEl.children)) {
    if (child === scroll)
      continue
    const el = child as HTMLElement
    if (isNodeToolbarButton(el)) {
      if (!mount.contains(el))
        mount.appendChild(el)
      continue
    }
    el.remove()
  }

  return mount
}

function createCategoryTitle(category: FlowGameNodeCategory, group: HTMLElement): HTMLElement {
  const titleBtn = document.createElement('button')
  titleBtn.type = 'button'
  titleBtn.className = TITLE_BTN_CLASS
  titleBtn.setAttribute('aria-expanded', 'true')

  const chevron = document.createElement('span')
  chevron.className = CHEVRON_CLASS
  chevron.innerHTML = CHEVRON_SVG

  const label = document.createElement('span')
  label.textContent = category.label

  titleBtn.appendChild(chevron)
  titleBtn.appendChild(label)

  if (isCategoryCollapsed(category.id)) {
    group.classList.add(COLLAPSED_CLASS)
    titleBtn.setAttribute('aria-expanded', 'false')
  }

  titleBtn.addEventListener('click', (event) => {
    event.stopPropagation()
    event.preventDefault()
    const collapsed = !group.classList.contains(COLLAPSED_CLASS)
    if (collapsed) {
      group.classList.add(COLLAPSED_CLASS)
      titleBtn.setAttribute('aria-expanded', 'false')
    }
    else {
      group.classList.remove(COLLAPSED_CLASS)
      titleBtn.setAttribute('aria-expanded', 'true')
    }
    setCategoryCollapsed(category.id, collapsed)
  })

  return titleBtn
}

function reorganizeToolbarNodeCategories(baseEl: HTMLElement) {
  const buttons = collectToolbarNodeButtons(baseEl)
  if (!buttons.length)
    return

  const grouped = new Map<string, HTMLElement[]>()
  for (const button of buttons) {
    const nodeType = button.getAttribute('data-node-type') || ''
    const categoryId = resolveNodeCategory(nodeType)
    if (!grouped.has(categoryId))
      grouped.set(categoryId, [])
    grouped.get(categoryId)!.push(button)
  }

  const mount = ensureCategoryShell(baseEl)
  mount.replaceChildren()

  for (const category of getSortedNodeCategories()) {
    const items = grouped.get(category.id)
    if (!items?.length)
      continue

    const group = document.createElement('div')
    group.className = GROUP_CLASS
    group.setAttribute('data-flowgame-category', category.id)

    group.appendChild(createCategoryTitle(category, group))

    const list = document.createElement('div')
    list.className = LIST_CLASS
    for (const button of items)
      list.appendChild(button)
    group.appendChild(list)

    mount.appendChild(group)
  }
}

function bindCategoryLayoutObserver(baseEl: HTMLElement) {
  if (baseEl.getAttribute(OBSERVER_ATTR) === '1')
    return
  let rafId = 0
  const observer = new MutationObserver(() => {
    if (!needsCategoryLayout(baseEl))
      return
    if (rafId)
      cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (needsCategoryLayout(baseEl))
        reorganizeToolbarNodeCategories(baseEl)
    })
  })
  observer.observe(baseEl, { childList: true, subtree: true })
  baseEl.setAttribute(OBSERVER_ATTR, '1')
}

/** 将「基础节点」列表按外部 category 映射分组展示（不修改 CustomNode 字段） */
export function patchFlowToolbarNodeCategories(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return

  injectCategoryStyles(hostRoot)

  const baseEl = hostRoot.querySelector('.tf-toolbar-container-base') as HTMLElement | null
  if (!baseEl)
    return

  if (needsCategoryLayout(baseEl))
    reorganizeToolbarNodeCategories(baseEl)
  else
    ensureCategoryShell(baseEl)

  bindCategoryLayoutObserver(baseEl)
}
