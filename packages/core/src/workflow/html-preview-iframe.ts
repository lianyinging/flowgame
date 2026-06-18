/** 将 HTML 文档写入 iframe；部分环境对空 sandbox 的 srcdoc 展示不稳定，提供 blob 回退 */

const blobUrlByIframe = new WeakMap<HTMLIFrameElement, string>()
const blobFallbackByIframe = new WeakMap<HTMLIFrameElement, boolean>()

function revokeBlobUrl(iframe: HTMLIFrameElement) {
  const prev = blobUrlByIframe.get(iframe)
  if (prev) {
    URL.revokeObjectURL(prev)
    blobUrlByIframe.delete(iframe)
  }
}

export function applyHtmlPreviewToIframe(
  iframe: HTMLIFrameElement | null | undefined,
  documentHtml: string
) {
  if (!iframe)
    return

  revokeBlobUrl(iframe)
  blobFallbackByIframe.delete(iframe)
  iframe.removeAttribute('src')

  const useBlobFallback = () => {
    if (!iframe.isConnected || blobFallbackByIframe.get(iframe))
      return
    blobFallbackByIframe.set(iframe, true)
    revokeBlobUrl(iframe)
    const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    blobUrlByIframe.set(iframe, url)
    iframe.removeAttribute('srcdoc')
    iframe.src = url
  }

  iframe.onload = () => {
    if (blobFallbackByIframe.get(iframe))
      return
    try {
      const bodyHtml = iframe.contentDocument?.body?.innerHTML?.trim() ?? ''
      if (bodyHtml)
        return
    }
    catch {
      /* sandbox / timing */
    }
    useBlobFallback()
  }

  iframe.srcdoc = documentHtml
}

export function disposeHtmlPreviewIframe(iframe: HTMLIFrameElement | null | undefined) {
  if (!iframe)
    return
  blobFallbackByIframe.delete(iframe)
  revokeBlobUrl(iframe)
}
