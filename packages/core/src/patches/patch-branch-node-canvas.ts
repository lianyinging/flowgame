import { getTinyflowHostRoot } from '../tinyflow/tinyflow-host'
import { IF_NODE_TYPE } from '../nodes/node-if'
import { SWITCH_NODE_TYPE } from '../nodes/node-switch'

const STYLE_ID = 'flowgame-branch-node-canvas-style'

const BRANCH_NODE_CANVAS_STYLES = `
.flowgame-node-canvas-section {
  margin-top: 10px;
}

.flowgame-node-canvas-section > .heading {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.flowgame-canvas-section-heading,
.flowgame-node-canvas-section > .heading > span {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--tf-foreground, #1d2129);
}

.flowgame-if-branches-canvas,
.flowgame-switch-cases-canvas {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 4px;
}

.flowgame-if-canvas-row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 88px 24px;
  gap: 6px;
  align-items: start;
  min-height: 32px;
}

.flowgame-switch-canvas-row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 88px 24px;
  gap: 6px;
  align-items: start;
  min-height: 32px;
}

.flowgame-switch-canvas-row--else .flowgame-switch-canvas-row__field {
  min-height: 28px;
}

.flowgame-if-canvas-row__edge,
.flowgame-switch-canvas-row .flowgame-if-canvas-row__edge {
  min-width: 0;
  padding-top: 2px;
}

.flowgame-if-canvas-row__edge-select {
  width: 100%;
  min-height: 28px;
  padding: 2px 4px;
  font-size: 11px;
  line-height: 1.3;
  color: var(--tf-foreground, #1d2129);
  background: #fff;
  border: 1px solid var(--tf-border, #e5e6eb);
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
}

.flowgame-if-canvas-row__edge-select:disabled {
  color: var(--tf-muted-foreground, #86909c);
  background: var(--tf-muted, #f7f8fa);
  cursor: not-allowed;
}

.flowgame-if-canvas-row--else .flowgame-if-canvas-row__field {
  min-height: 28px;
}

.flowgame-if-canvas-row__label,
.flowgame-switch-canvas-row__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--tf-muted-foreground, #86909c);
  white-space: nowrap;
}

.flowgame-if-canvas-row__field {
  width: 100%;
  min-height: 28px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--tf-foreground, #1d2129);
  background: #fff;
  border: 1px solid var(--tf-border, #e5e6eb);
  border-radius: 4px;
  box-sizing: border-box;
}

.flowgame-if-canvas-row__field:not(textarea) {
  display: flex;
  align-items: center;
  color: var(--tf-muted-foreground, #86909c);
  background: var(--tf-muted, #f7f8fa);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

textarea.flowgame-if-canvas-row__field {
  resize: vertical;
  min-height: 44px;
  font-family: inherit;
}

.flowgame-if-canvas-row__actions {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2px;
}

.flowgame-if-canvas-row__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  color: var(--tf-muted-foreground, #86909c);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.flowgame-if-canvas-row__remove:hover {
  color: rgb(var(--danger-6, 245, 63, 63));
  background: rgb(var(--danger-1, 255, 236, 232));
}

.flowgame-if-canvas-row__remove-placeholder {
  width: 22px;
  height: 22px;
}

.flowgame-if-add-elseif-mount {
  width: 100%;
  margin-top: 4px;
}

.flowgame-if-add-elseif__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 2px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(var(--primary-6, 22, 93, 255));
  background: transparent;
  border: 1px dashed rgb(var(--primary-3, 190, 218, 255));
  border-radius: 4px;
  cursor: pointer;
}

.flowgame-if-add-elseif__btn:hover {
  background: rgb(var(--primary-1, 232, 243, 255));
}

.flowgame-switch-add-case-mount {
  width: 100%;
  margin-top: 4px;
}

.flowgame-switch-add-case__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 2px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(var(--primary-6, 22, 93, 255));
  background: transparent;
  border: 1px dashed rgb(var(--primary-3, 190, 218, 255));
  border-radius: 4px;
  cursor: pointer;
}

.flowgame-switch-add-case__btn:hover {
  background: rgb(var(--primary-1, 232, 243, 255));
}

.flowgame-switch-canvas-row__field {
  width: 100%;
  min-height: 28px;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--tf-foreground, #1d2129);
  background: #fff;
  border: 1px solid var(--tf-border, #e5e6eb);
  border-radius: 4px;
  box-sizing: border-box;
}

.flowgame-switch-canvas-row__field:not(input) {
  display: flex;
  align-items: center;
  color: var(--tf-muted-foreground, #86909c);
  background: var(--tf-muted, #f7f8fa);
}
`

function injectStyles(hostRoot: ShadowRoot | HTMLElement) {
  if (hostRoot.querySelector(`#${STYLE_ID}`))
    return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = BRANCH_NODE_CANVAS_STYLES
  hostRoot.appendChild(style)
}

function restoreDefaultSourceHandles(nodeEl: HTMLElement) {
  nodeEl.querySelectorAll<HTMLElement>('.svelte-flow__handle.source').forEach((handle) => {
    if (handle.dataset.flowgameBranchClone === '1') {
      handle.remove()
      return
    }
    handle.style.display = ''
    handle.style.pointerEvents = ''
    handle.style.opacity = ''
  })
  nodeEl.querySelector('.flowgame-branch-handle-layer')?.remove()
}

/** 分支节点画布样式，并清理历史多连线桩 DOM */
export function patchBranchNodeCanvasDom(
  canvas: HTMLElement | undefined,
  workflow: { nodes?: Array<{ id?: string, type?: string, data?: Record<string, unknown> }> }
) {
  if (!canvas)
    return
  const hostRoot = getTinyflowHostRoot(canvas)
  if (!hostRoot)
    return
  injectStyles(hostRoot)

  const branchNodeIds = new Set(
    (workflow.nodes ?? [])
      .filter(n => n.type === IF_NODE_TYPE || n.type === SWITCH_NODE_TYPE)
      .map(n => n.id)
      .filter((id): id is string => Boolean(id))
  )

  hostRoot.querySelectorAll('.svelte-flow__node').forEach((nodeEl) => {
    const el = nodeEl as HTMLElement
    const id = el.getAttribute('data-id')
    if (id && branchNodeIds.has(id))
      restoreDefaultSourceHandles(el)
    el.classList.remove('flowgame-if-node--expanded', 'flowgame-switch-node--expanded')
  })
}
