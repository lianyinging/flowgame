import type { Node } from '@xyflow/svelte'
import { DEFAULT_HTML_TEMPLATE } from '../nodes/node-html-template'

const TEMPLATE_LABEL = '模板内容'

/** 画布 Tinyflow forms：模板在 .tf-textarea（contenteditable）或 textarea 中 */
export function readHtmlTemplateFromNodeBody(body: HTMLElement): string | null {
  for (const titleEl of body.querySelectorAll('.setting-title')) {
    if ((titleEl.textContent ?? '').trim() !== TEMPLATE_LABEL)
      continue
    const item = titleEl.nextElementSibling
    if (!(item instanceof HTMLElement))
      continue
    const textarea = item.querySelector('textarea')
    if (textarea) {
      const v = textarea.value
      return v != null ? v : null
    }
    const tfTextarea = item.querySelector<HTMLElement>('.tf-textarea')
    if (tfTextarea) {
      const v = tfTextarea.innerText ?? tfTextarea.textContent ?? ''
      return v
    }
  }
  return null
}

export function readHtmlTemplateFromNodeData(node: Node): string {
  const data = (node.data ?? {}) as Record<string, unknown>
  const tpl = data.template
  return typeof tpl === 'string' ? tpl : ''
}

/** 优先画布 DOM（最新编辑），其次 node.data，最后默认模板 */
export function resolveHtmlTemplateSource(
  node: Node,
  body?: HTMLElement | null
): string {
  if (body) {
    const fromDom = readHtmlTemplateFromNodeBody(body)
    if (fromDom != null && fromDom.trim())
      return fromDom
  }
  const fromData = readHtmlTemplateFromNodeData(node)
  if (fromData.trim())
    return fromData
  return DEFAULT_HTML_TEMPLATE
}
