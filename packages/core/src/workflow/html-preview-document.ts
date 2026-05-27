/** 将渲染后的 HTML 片段包装为 iframe srcdoc 完整文档 */

export function wrapHtmlPreviewDocument(html: string): string {
  const raw = html ?? ''
  if (!raw.trim()) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:12px;color:#86909c;font:13px system-ui,sans-serif">（空模板）</body></html>'
  }
  const t = raw.trim()
  if (/^<!doctype/i.test(t) || /^<html[\s>]/i.test(t))
    return raw
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;font-family:system-ui,sans-serif}</style></head><body>${raw}</body></html>`
}
