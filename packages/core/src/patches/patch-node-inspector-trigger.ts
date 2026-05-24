import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

const STYLE_ID = 'flowgame-node-edit-trigger-style'
const TITLE_SELECTOR = '.tf-node-wrapper-title'
const EDIT_BTN_CLASS = 'flowgame-node-edit-btn'

export const FLOWGAME_OPEN_NODE_INSPECTOR_EVENT = 'flowgame:open-node-inspector'

const EDIT_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.7574 2.99678L14.7574 4.99678H5V18.9968H19V9.23943L21 7.23943V19.9968C21 20.5491 20.5523 20.9968 20 20.9968H4C3.44772 20.9968 3 20.5491 3 19.9968V5.99678C3 5.4445 3.44772 4.99678 4 4.99678H16.7574ZM20.678 2.80761L21.5 3.62943L12.329 12.8004L11.5072 11.9786L20.678 2.80761Z"></path></svg>'

const EDIT_TRIGGER_STYLES = `
.tf-node-wrapper-title {
  justify-content: space-between !important;
  padding-right: 4px !important;
  gap: 4px;
}

.tf-node-wrapper-title::before {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.${EDIT_BTN_CLASS} {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: auto;
  border: none;
  border-radius: 4px;
  padding: 0;
  background: transparent;
  color: var(--tf-muted-foreground, #86909c);
  cursor: pointer;
  line-height: 0;
}

.${EDIT_BTN_CLASS}:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--tf-primary, #3b82f6);
}

.${EDIT_BTN_CLASS}:focus-visible {
  outline: 2px solid var(--tf-ring, #94a3b8);
  outline-offset: 1px;
}

.${EDIT_BTN_CLASS} svg {
  width: 14px;
  height: 14px;
  display: block;
}
`

function injectEditTriggerStyles(hostRoot: ShadowRoot | HTMLElement) {
  const existing = hostRoot instanceof ShadowRoot
    ? hostRoot.getElementById(STYLE_ID)
    : hostRoot.querySelector<HTMLStyleElement>(`#${STYLE_ID}`)
  if (existing) {
    existing.textContent = EDIT_TRIGGER_STYLES
    return
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = EDIT_TRIGGER_STYLES
  hostRoot.appendChild(style)
}

function resolveNodeIdFromTitle(titleEl: Element): string | null {
  const nodeEl = titleEl.closest('.svelte-flow__node')
  const id = nodeEl?.getAttribute('data-id')?.trim()
  return id || null
}

function ensureEditButton(
  titleEl: HTMLElement,
  canvas: HTMLElement,
  readonly: boolean
) {
  let btn = titleEl.querySelector<HTMLButtonElement>(`.${EDIT_BTN_CLASS}`)
  if (readonly) {
    btn?.remove()
    return
  }
  if (!btn) {
    btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `${EDIT_BTN_CLASS} nopan nodrag`
    btn.title = '编辑节点配置'
    btn.setAttribute('aria-label', '编辑节点配置')
    btn.innerHTML = EDIT_ICON_SVG
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      const nodeId = resolveNodeIdFromTitle(titleEl)
      if (!nodeId)
        return
      canvas.dispatchEvent(new CustomEvent(FLOWGAME_OPEN_NODE_INSPECTOR_EVENT, {
        detail: { nodeId },
        bubbles: true
      }))
    })
    titleEl.appendChild(btn)
  }
}

function patchNodeTitleEditButtons(
  hostRoot: ShadowRoot | HTMLElement,
  canvas: HTMLElement,
  readonly: boolean
) {
  hostRoot.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach((titleEl) => {
    ensureEditButton(titleEl, canvas, readonly)
  })
}

/** 在节点标题栏（FlowGame.ai）右侧挂载编辑图标，点击打开侧栏 */
export function patchNodeInspectorTrigger(
  canvas: HTMLElement | undefined,
  options?: { readonly?: boolean }
) {
  if (!canvas)
    return
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  injectEditTriggerStyles(hostRoot)
  patchNodeTitleEditButtons(hostRoot, canvas, options?.readonly === true)
}

/** 卸载画布时移除注入样式（按钮随节点 DOM 一并销毁） */
export function cleanupNodeInspectorTrigger(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  if (hostRoot instanceof ShadowRoot)
    hostRoot.getElementById(STYLE_ID)?.remove()
  else
    hostRoot.querySelector(`#${STYLE_ID}`)?.remove()
}
