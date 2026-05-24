import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

const STYLE_ID = 'flowgame-canvas-minimap-style'
export const MINIMAP_HIDDEN_CLASS = 'flowgame-minimap--hidden'

const MINIMAP_STYLES = `
.svelte-flow__minimap.${MINIMAP_HIDDEN_CLASS} {
  display: none !important;
}

.svelte-flow__minimap.svelte-flow__panel {
  border: 1px solid var(--color-border-2, #e5e6eb) !important;
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
}

.svelte-flow__minimap-svg {
  display: block;
  border-radius: 8px;
  background: #ebebeb;
}

/* 视口：外侧白色遮罩 + #EBEBEB 虚线描边 */
.svelte-flow__minimap-mask {
  fill: #ffffff !important;
  stroke: #ebebeb !important;
  stroke-width: 1.5px !important;
  stroke-dasharray: 5 4;
  --xy-minimap-mask-background-color-props: #ffffff;
  --xy-minimap-mask-stroke-color-props: #ebebeb;
  --xy-minimap-mask-stroke-width-props: 1.5;
}
`

function injectMinimapStyles(hostRoot: ShadowRoot | HTMLElement) {
  const existing = hostRoot instanceof ShadowRoot
    ? hostRoot.getElementById(STYLE_ID)
    : hostRoot.querySelector<HTMLStyleElement>(`#${STYLE_ID}`)
  if (existing) {
    existing.textContent = MINIMAP_STYLES
    return
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = MINIMAP_STYLES
  hostRoot.appendChild(style)
}

export function patchCanvasMinimapStyle(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  injectMinimapStyles(hostRoot)
}

export function setCanvasMinimapVisible(canvas: HTMLElement | undefined, visible: boolean) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  hostRoot.querySelectorAll('.svelte-flow__minimap').forEach((el) => {
    el.classList.toggle(MINIMAP_HIDDEN_CLASS, !visible)
  })
}
