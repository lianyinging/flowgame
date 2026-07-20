import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'

const STYLE_ID = 'flowgame-canvas-watermark-style'
/** 画布背景与节点左上角品牌水印默认文案 */
export const DEFAULT_CANVAS_WATERMARK = 'FlowGame.ai'

let canvasWatermark = DEFAULT_CANVAS_WATERMARK

function escapeCssContent(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function resolveWatermark(override?: string) {
  const value = (override ?? canvasWatermark ?? '').trim()
  return value || DEFAULT_CANVAS_WATERMARK
}

function buildWatermarkStyles(text: string) {
  const content = escapeCssContent(text)
  return `
.tinyflow-logo::after {
  content: "${content}" !important;
}
.tf-node-wrapper-title {
  font-size: 0 !important;
  letter-spacing: 0 !important;
}
.tf-node-wrapper-title::before {
  content: "${content}";
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 1px;
  color: var(--tf-muted-foreground);
}
`
}

/** 全局配置画布品牌水印（也可通过 configureFlowGameClient({ canvasWatermark })） */
export function configureCanvasWatermark(text?: string) {
  const value = (text ?? '').trim()
  canvasWatermark = value || DEFAULT_CANVAS_WATERMARK
}

export function getCanvasWatermark() {
  return canvasWatermark
}

function injectWatermarkStyles(hostRoot: ShadowRoot | HTMLElement, text: string) {
  const css = buildWatermarkStyles(text)
  if (hostRoot instanceof ShadowRoot) {
    let style = hostRoot.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ID
      hostRoot.appendChild(style)
    }
    style.textContent = css
    return
  }
  let style = hostRoot.querySelector(`#${STYLE_ID}`) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    hostRoot.appendChild(style)
  }
  style.textContent = css
}

function patchNodeTitleWatermarks(hostRoot: ShadowRoot | HTMLElement) {
  hostRoot.querySelectorAll('.tf-node-wrapper-title').forEach((el) => {
    for (const child of [...el.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE)
        child.remove()
    }
  })
}

/**
 * 将 Tinyflow 画布背景与节点左上角水印改为指定文案。
 * @param watermark 本次覆盖值；不传则用全局 configureCanvasWatermark / configureFlowGameClient 配置
 */
export function patchCanvasWatermark(canvas: HTMLElement | undefined, watermark?: string) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  const text = resolveWatermark(watermark)
  injectWatermarkStyles(hostRoot, text)
  patchNodeTitleWatermarks(hostRoot)
}
