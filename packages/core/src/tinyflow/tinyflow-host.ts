const TINYFLOW_TAG = 'tinyflow-component'

/** Tinyflow 画布内容在 shadowRoot 内，需从此处查询 DOM */
export function getTinyflowHostRoot(canvas: HTMLElement | undefined): ShadowRoot | HTMLElement | null {
  if (!canvas)
    return null

  const host = canvas.querySelector(TINYFLOW_TAG) as HTMLElement | null
  if (host?.shadowRoot)
    return host.shadowRoot

  return canvas
}

export function getTinyflowHostElement(canvas: HTMLElement | undefined): HTMLElement | null {
  if (!canvas)
    return null
  return canvas.querySelector(TINYFLOW_TAG) as HTMLElement | null
}
