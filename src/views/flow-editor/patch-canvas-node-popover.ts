import { getTinyflowHostRoot } from './tinyflow-host'

const STYLE_ID = 'flowgame-canvas-node-popover-style'

/**
 * Tinyflow 节点内「⋯」更多设置浮层（floating-ui + position:absolute）
 * 浮层容器默认 width:100%，在输出参数最右侧窄列会被裁切。
 */
const NODE_POPOVER_STYLES = `
.svelte-flow__node {
  overflow: visible !important;
}

.tf-node-wrapper,
.tf-node-wrapper-body,
.tf-node-wrapper-body .input-item {
  overflow: visible !important;
}

.tf-node-wrapper-body .input-item > div[style*="position: relative"] {
  overflow: visible !important;
}

.tf-node-wrapper-body .input-item > div[style*="position: relative"] > div[style*="z-index"] {
  width: max-content !important;
  max-width: none !important;
  overflow: visible !important;
}

.input-more-setting {
  box-sizing: border-box;
}

/* 与 Tinyflow input-container（40% / 50% / 10%）一致 */
.tf-node-wrapper-body .input-container,
.flowgame-kb-base-picker.input-container {
  display: grid;
  grid-template-columns: 40% 50% 10%;
  row-gap: 5px;
  column-gap: 3px;
  width: 100%;
  margin-top: 10px;
}

.tf-node-wrapper-body .input-container .input-header,
.flowgame-kb-base-picker.input-container .input-header {
  font-size: 12px;
  color: var(--tf-muted-foreground, #86909c);
}

.tf-node-wrapper-body .input-container .input-item,
.flowgame-kb-base-picker.input-container .input-item {
  display: flex;
  align-items: center;
  min-width: 0;
}

.tf-node-wrapper-body .input-container .tf-kb-input-container__more,
.flowgame-kb-base-picker.input-container .tf-kb-input-container__more {
  justify-content: center;
}

.tf-node-wrapper-body .input-container .tf-param-name-label,
.flowgame-kb-base-picker .tf-param-name-label {
  width: 100%;
  font-size: 13px;
  line-height: 36px;
  color: var(--tf-muted-foreground, #86909c);
  user-select: none;
}

/* 参数名称列：灰字、无边框（覆盖 Tinyflow 默认 input 外观） */
.tf-node-wrapper-body .input-container > .input-item:nth-child(3n+4) input:disabled,
.tf-node-wrapper-body .input-container > .input-item:nth-child(3n+4) input[readonly] {
  color: var(--tf-muted-foreground, #86909c) !important;
  -webkit-text-fill-color: var(--tf-muted-foreground, #86909c) !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.flowgame-kb-base-picker .flowgame-kb-tf-select-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}

.flowgame-kb-base-picker .flowgame-kb-tf-select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 100%;
  max-height: 240px;
  overflow-y: auto;
}

.flowgame-kb-base-picker .flowgame-kb-tf-select-menu[hidden] {
  display: none !important;
}

.flowgame-kb-base-picker .tf-select-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  color: var(--tf-muted-foreground, #86909c);
}
`

function injectNodePopoverStyles(hostRoot: ShadowRoot | HTMLElement) {
  const existing = hostRoot instanceof ShadowRoot
    ? hostRoot.getElementById(STYLE_ID)
    : hostRoot.querySelector<HTMLStyleElement>(`#${STYLE_ID}`)
  if (existing) {
    existing.textContent = NODE_POPOVER_STYLES
    return
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = NODE_POPOVER_STYLES
  hostRoot.appendChild(style)
}

export function patchCanvasNodePopover(canvas: HTMLElement | undefined) {
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  injectNodePopoverStyles(hostRoot)
}
