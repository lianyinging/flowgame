import { getTinyflowHostRoot } from './tinyflow-host'

function getCanvasLeftToolbar(canvas: HTMLElement | undefined): HTMLElement | null {
  const hostRoot = getTinyflowHostRoot(canvas)
  return hostRoot?.querySelector('.tf-toolbar') as HTMLElement | null
}

/** 左侧节点面板是否展开（Tinyflow .tf-toolbar.show） */
export function isCanvasLeftToolbarVisible(canvas: HTMLElement | undefined): boolean {
  return getCanvasLeftToolbar(canvas)?.classList.contains('show') ?? false
}

/** 显示/隐藏画布左侧节点菜单 */
export function setCanvasLeftToolbarVisible(canvas: HTMLElement | undefined, visible: boolean) {
  getCanvasLeftToolbar(canvas)?.classList.toggle('show', visible)
}

/** 切换画布左侧节点菜单 */
export function toggleCanvasLeftToolbar(canvas: HTMLElement | undefined): boolean {
  const toolbar = getCanvasLeftToolbar(canvas)
  if (!toolbar)
    return false
  toolbar.classList.toggle('show')
  return toolbar.classList.contains('show')
}

/** 切换画布锁定（复用 Svelte Flow 内置交互开关） */
export function toggleCanvasInteractionLock(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  hostRoot?.querySelector('.svelte-flow__controls-interactive')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true })
  )
}

export function isCanvasInteractionLocked(canvas: HTMLElement | undefined): boolean {
  const hostRoot = getTinyflowHostRoot(canvas)
  const btn = hostRoot?.querySelector('.svelte-flow__controls-interactive')
  return btn?.getAttribute('aria-pressed') === 'true'
}
