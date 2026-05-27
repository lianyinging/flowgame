import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import { formatHtmlTemplate } from '../workflow/format-html-template'
import { applyHtmlPreviewToIframe } from '../workflow/html-preview-iframe'
import { wrapHtmlPreviewDocument } from '../workflow/html-preview-document'
import { buildHtmlTemplatePreviewMap } from '../workflow/html-template-preview-map'
import { resolveHtmlTemplateSource } from '../workflow/read-html-template-source'
import type { FlowParameter } from '../inspector/node-inspector-config'

type FlowApi = ReturnType<typeof useSvelteFlow>

const PREVIEW_MOUNT_CLASS = 'flowgame-html-template-canvas-preview'
const IFRAME_CLASS = 'flowgame-html-template-editor__iframe'

const hostStateByBody = new WeakMap<HTMLElement, {
  nodeId: string
  previewOpen: boolean
  flow: FlowApi
}>()

function resolveMountRoot(host: HTMLElement): HTMLElement {
  return (host.closest('.tf-node-wrapper-body') as HTMLElement | null) ?? host
}

function readParameters(node: Node): FlowParameter[] {
  const data = (node.data ?? {}) as Record<string, unknown>
  const raw = data.parameters
  return Array.isArray(raw) ? (raw as FlowParameter[]) : []
}

function findTemplateFieldAnchor(body: HTMLElement): HTMLElement | null {
  for (const titleEl of body.querySelectorAll('.setting-title')) {
    if ((titleEl.textContent ?? '').trim() !== '模板内容')
      continue
    const item = titleEl.nextElementSibling
    if (item instanceof HTMLElement)
      return item
  }
  return null
}

function resolveLiveNode(flow: FlowApi, node: Node): Node {
  return flow.getNode(node.id) ?? node
}

function renderPreviewSrcdoc(body: HTMLElement, node: Node): string {
  const params = readParameters(node)
  const map = buildHtmlTemplatePreviewMap(params)
  const template = resolveHtmlTemplateSource(node, body)
  const html = formatHtmlTemplate(template, map)
  return wrapHtmlPreviewDocument(html)
}

function ensurePreviewMount(body: HTMLElement, _node: Node): HTMLElement {
  let mount = body.querySelector<HTMLElement>(`.${PREVIEW_MOUNT_CLASS}`)
  if (mount)
    return mount

  mount = document.createElement('div')
  mount.className = `${PREVIEW_MOUNT_CLASS} nopan nodrag`
  const anchor = findTemplateFieldAnchor(body)
  if (anchor)
    anchor.insertAdjacentElement('afterend', mount)
  else
    body.appendChild(mount)
  return mount
}

function syncPreviewPanel(
  mount: HTMLElement,
  body: HTMLElement,
  flow: FlowApi,
  node: Node,
  open: boolean
) {
  mount.replaceChildren()

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'flowgame-html-template-editor__canvas-preview-btn nopan nodrag'
  toggle.textContent = open ? '收起预览' : '预览 HTML'
  toggle.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    const state = hostStateByBody.get(body)
    if (!state)
      return
    state.previewOpen = !state.previewOpen
    const liveNode = resolveLiveNode(state.flow, node)
    syncPreviewPanel(mount, body, state.flow, liveNode, state.previewOpen)
  })
  mount.appendChild(toggle)

  if (!open)
    return

  const wrap = document.createElement('div')
  wrap.className = 'flowgame-html-template-editor__iframe-wrap flowgame-html-template-editor__iframe-wrap--canvas'
  const iframe = document.createElement('iframe')
  iframe.className = IFRAME_CLASS
  iframe.title = 'html-template-preview'
  iframe.setAttribute('sandbox', 'allow-same-origin')
  wrap.appendChild(iframe)
  mount.appendChild(wrap)

  const liveNode = resolveLiveNode(flow, node)
  applyHtmlPreviewToIframe(iframe, renderPreviewSrcdoc(body, liveNode))
}

/** 保留 Tinyflow 自带 tf-textarea，仅追加「预览 HTML」 */
export function mountHtmlTemplateCanvasPreview(
  host: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  const body = resolveMountRoot(host)
  const mount = ensurePreviewMount(body, node)
  const liveNode = resolveLiveNode(flow, node)

  let state = hostStateByBody.get(body)
  if (!state) {
    state = { nodeId: liveNode.id, previewOpen: false, flow }
    hostStateByBody.set(body, state)
    syncPreviewPanel(mount, body, flow, liveNode, false)
    return
  }

  state.flow = flow
  if (state.nodeId !== liveNode.id) {
    state.nodeId = liveNode.id
    state.previewOpen = false
  }

  syncPreviewPanel(mount, body, flow, liveNode, state.previewOpen)
}

export function updateHtmlTemplateCanvasPreview(host: HTMLElement, node: Node) {
  const body = resolveMountRoot(host)
  const mount = body.querySelector<HTMLElement>(`.${PREVIEW_MOUNT_CLASS}`)
  const state = hostStateByBody.get(body)
  if (!mount || !state)
    return

  if (!state.previewOpen)
    return

  const liveNode = resolveLiveNode(state.flow, node)
  const iframe = mount.querySelector<HTMLIFrameElement>(`.${IFRAME_CLASS}`)
  if (iframe)
    applyHtmlPreviewToIframe(iframe, renderPreviewSrcdoc(body, liveNode))
}
