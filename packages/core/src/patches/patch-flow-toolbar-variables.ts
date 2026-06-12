import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'
import { patchFlowToolbarNodeCategories } from './patch-flow-toolbar-node-categories'

const BUSINESS_LINK_ATTR = 'data-flowgame-business-link'
const BUSINESS_MENU_CLICK_ATTR = 'data-flowgame-business-menu-click'
export const FLOWGAME_OPEN_FLOW_LIST_EVENT = 'flowgame:open-flow-list'
export const FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT = 'flowgame:open-flow-knowledge'

const BUSINESS_MENU_EVENTS: Record<string, string> = {
  'flow-list': FLOWGAME_OPEN_FLOW_LIST_EVENT,
  'flow-knowledge': FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT
}

function bindBusinessMenuClick(el: HTMLElement, menuId: string, canvas: HTMLElement) {
  const eventName = BUSINESS_MENU_EVENTS[menuId]
  if (!eventName)
    return
  el.style.cursor = 'pointer'
  if (el.getAttribute(BUSINESS_MENU_CLICK_ATTR) === menuId)
    return
  el.setAttribute(BUSINESS_MENU_CLICK_ATTR, menuId)
  el.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    canvas.dispatchEvent(new CustomEvent(eventName, { bubbles: true }))
  })
}

const VARS_TAB_ATTR = 'data-flowgame-vars-tab'
const VARS_BODY_CLASS = 'tf-toolbar-container-vars'
const LISTENERS_ATTR = 'data-flowgame-vars-listeners'
const STYLE_ID = 'flowgame-toolbar-vars-style'
const TAB_ATTR = 'data-flowgame-tab'

export type ToolbarTab = 'base' | 'tools' | 'variables'

/** 左右侧面板统一高度（右侧详情同步左侧 .tf-toolbar-container） */
const TOOLBAR_PANEL_HEIGHT = 'min(720px, calc(100vh - 88px))'

const SHADOW_TOOLBAR_STYLES = `
.tf-toolbar.show {
  height: ${TOOLBAR_PANEL_HEIGHT} !important;
  max-height: ${TOOLBAR_PANEL_HEIGHT} !important;
}
.tf-toolbar-container {
  min-width: 200px;
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  box-sizing: border-box;
}
.tf-toolbar-container-header {
  flex-shrink: 0;
}
.tf-toolbar-container-body {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}
/* 勿加 display:flex !important，否则会覆盖 Tinyflow 隐藏 Tab 的 inline style */
.tf-toolbar-container-base {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow: hidden !important;
  flex-direction: column !important;
}
.tf-toolbar-container-tools {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  flex-direction: column !important;
}
.tf-toolbar-container-header .tf-tabs {
  flex-wrap: wrap !important;
  justify-content: flex-start !important;
  align-content: flex-start;
  gap: 6px !important;
  width: 100% !important;
  box-sizing: border-box;
}
.tf-toolbar-container-header .tf-tabs .tf-tabs-item {
  flex: 0 1 calc(50% - 3px) !important;
  flex-grow: 0 !important;
  min-width: calc(50% - 3px) !important;
  max-width: calc(50% - 3px) !important;
  box-sizing: border-box;
  text-align: center;
  justify-content: center;
}
.${VARS_BODY_CLASS} {
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  width: 100%;
}
`

function injectToolbarStyles(hostRoot: ShadowRoot | HTMLElement) {
  const existing = hostRoot instanceof ShadowRoot
    ? hostRoot.getElementById(STYLE_ID)
    : hostRoot.querySelector<HTMLStyleElement>(`#${STYLE_ID}`)
  if (existing) {
    existing.textContent = SHADOW_TOOLBAR_STYLES
    return
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = SHADOW_TOOLBAR_STYLES
  hostRoot.appendChild(style)
}

function updateToolbarTabActive(toolbar: Element, active: ToolbarTab) {
  const tabs = toolbar.querySelector('.tf-toolbar-container-header .tf-tabs')
  if (!tabs)
    return
  tabs.querySelectorAll('.tf-tabs-item').forEach((item) => {
    const el = item as HTMLElement
    if (el.hasAttribute(VARS_TAB_ATTR)) {
      el.classList.toggle('active', active === 'variables')
      return
    }
    const tab = el.getAttribute(TAB_ATTR) as ToolbarTab | null
    el.classList.toggle('active', tab === active)
  })
}

/** 流程变量 Tab：隐藏 Tinyflow 自带面板；基础/业务工具交给 Tinyflow 自己切换 display */
function setToolbarTab(toolbar: Element, active: ToolbarTab) {
  const baseEl = toolbar.querySelector('.tf-toolbar-container-base') as HTMLElement | null
  const toolsEl = toolbar.querySelector('.tf-toolbar-container-tools') as HTMLElement | null
  const varsEl = toolbar.querySelector(`.${VARS_BODY_CLASS}`) as HTMLElement | null
  if (!baseEl || !toolsEl || !varsEl)
    return

  updateToolbarTabActive(toolbar, active)

  if (active === 'variables') {
    baseEl.style.display = 'none'
    toolsEl.style.display = 'none'
    varsEl.style.display = 'flex'
    return
  }

  varsEl.style.display = 'none'
  baseEl.style.removeProperty('display')
  toolsEl.style.removeProperty('display')
}

/** 在 Tinyflow 左侧工具栏增加「流程变量」Tab，并返回变量树挂载容器 */
export function patchFlowToolbarVariables(canvas: HTMLElement | undefined): HTMLElement | null {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return null

  injectToolbarStyles(hostRoot)

  const toolbar = hostRoot.querySelector('.tf-toolbar')
  if (!toolbar)
    return null

  const tabs = toolbar.querySelector('.tf-toolbar-container-header .tf-tabs')
  const body = toolbar.querySelector('.tf-toolbar-container-body')
  if (!tabs || !body)
    return null

  if (!toolbar.querySelector(`[${VARS_TAB_ATTR}]`)) {
    const varsTab = document.createElement('div')
    varsTab.setAttribute('role', 'button')
    varsTab.setAttribute('tabindex', '2')
    varsTab.setAttribute(VARS_TAB_ATTR, '1')
    varsTab.className = 'tf-tabs-item'
    varsTab.textContent = '流程变量'
    varsTab.addEventListener('click', (e) => {
      e.stopPropagation()
      setToolbarTab(toolbar, 'variables')
    })
    tabs.appendChild(varsTab)
  }

  let varsEl = toolbar.querySelector(`.${VARS_BODY_CLASS}`) as HTMLElement | null
  if (!varsEl) {
    varsEl = document.createElement('div')
    varsEl.className = VARS_BODY_CLASS
    varsEl.style.display = 'none'
    body.appendChild(varsEl)
  }

  if (toolbar.getAttribute(LISTENERS_ATTR) !== '1') {
    tabs.querySelectorAll(`.tf-tabs-item:not([${VARS_TAB_ATTR}])`).forEach((item, index) => {
      const tab: ToolbarTab = index === 0 ? 'base' : 'tools'
      item.setAttribute(TAB_ATTR, tab)
    })
    tabs.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.tf-tabs-item') as HTMLElement | null
      if (!target || !toolbar.contains(target))
        return
      if (target.hasAttribute(VARS_TAB_ATTR))
        return
      const tab = target.getAttribute(TAB_ATTR) as ToolbarTab | null
      if (tab === 'base' || tab === 'tools')
        setToolbarTab(toolbar, tab)
    })
    toolbar.setAttribute(LISTENERS_ATTR, '1')
  }

  const toolsEl = toolbar.querySelector('.tf-toolbar-container-tools')
  if (toolsEl) {
    const menus = [
      { id: 'flow-list', title: '流程列表', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z"></path></svg>' },
      { id: 'flow-knowledge', title: '知识库配置', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5C13.567 5 12 6.567 12 8.5C12 10.433 13.567 12 15.5 12C17.433 12 19 10.433 19 8.5C19 6.567 17.433 5 15.5 5ZM10 8.5C10 5.46243 12.4624 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 9.6575 20.6424 10.7315 20.0317 11.6175L22.7071 14.2929L21.2929 15.7071L18.6175 13.0317C17.7315 13.6424 16.6575 14 15.5 14C12.4624 14 10 11.5376 10 8.5ZM3 4H8V6H3V4ZM3 11H8V13H3V11ZM21 18V20H3V18H21Z"></path></svg>' }
    ] as const
    for (const item of menus) {
      let el = toolsEl.querySelector<HTMLElement>(`[${BUSINESS_LINK_ATTR}="${item.id}"]`)
      if (!el) {
        el = document.createElement('div')
        el.className = 'tf-btn'
        el.setAttribute(BUSINESS_LINK_ATTR, item.id)
        el.innerHTML = `${item.icon} ${item.title}`
        const anchor = item.id === 'flow-knowledge'
          ? toolsEl.querySelector(`[${BUSINESS_LINK_ATTR}="flow-list"]`)?.nextSibling ?? null
          : toolsEl.firstChild
        toolsEl.insertBefore(el, anchor)
      }
      if (canvas)
        bindBusinessMenuClick(el, item.id, canvas)
    }
  }

  patchFlowToolbarNodeCategories(canvas)
  return varsEl
}
