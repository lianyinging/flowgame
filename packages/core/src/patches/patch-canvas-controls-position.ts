import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

const STYLE_ID = 'flowgame-canvas-controls-position-style'

/** 隐藏内置缩放控件，由页面顶部自定义工具栏接管 */
const CONTROLS_POSITION_STYLES = `
.svelte-flow__controls {
  display: none !important;
}
`

function injectControlsPositionStyles(hostRoot: ShadowRoot | HTMLElement) {
  if (hostRoot instanceof ShadowRoot) {
    if (hostRoot.getElementById(STYLE_ID))
      return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CONTROLS_POSITION_STYLES
    hostRoot.appendChild(style)
    return
  }
  if (hostRoot.querySelector(`#${STYLE_ID}`))
    return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CONTROLS_POSITION_STYLES
  hostRoot.appendChild(style)
}

export function patchCanvasControlsPosition(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  injectControlsPositionStyles(hostRoot)
}
