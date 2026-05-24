import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

const STYLE_ID = 'flowgame-canvas-watermark-style'
const NODE_WATERMARK = 'FlowGame.ai'

const WATERMARK_STYLES = `
.tinyflow-logo::after {
  content: "${NODE_WATERMARK}" !important;
}
.tf-node-wrapper-title {
  font-size: 0 !important;
  letter-spacing: 0 !important;
}
.tf-node-wrapper-title::before {
  content: "${NODE_WATERMARK}";
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 1px;
  color: var(--tf-muted-foreground);
}
`

function injectWatermarkStyles(hostRoot: ShadowRoot | HTMLElement) {
  if (hostRoot instanceof ShadowRoot) {
    if (hostRoot.getElementById(STYLE_ID))
      return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = WATERMARK_STYLES
    hostRoot.appendChild(style)
    return
  }
  if (hostRoot.querySelector(`#${STYLE_ID}`))
    return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = WATERMARK_STYLES
  hostRoot.appendChild(style)
}

function patchNodeTitleWatermarks(hostRoot: ShadowRoot | HTMLElement) {
  hostRoot.querySelectorAll('.tf-node-wrapper-title').forEach((el) => {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE)
        child.remove()
    }
  })
}

/** 将 Tinyflow 画布背景与节点左上角水印改为 FlowGame.ai */
export function patchCanvasWatermark(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  injectWatermarkStyles(hostRoot)
  patchNodeTitleWatermarks(hostRoot)
}
