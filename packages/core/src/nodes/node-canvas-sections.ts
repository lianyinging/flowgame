/** 画布节点：定位 Tinyflow「输入参数」区块，并在其后挂载自定义区域 */

export function findParametersInputContainer(body: HTMLElement): HTMLElement | null {
  for (const heading of body.querySelectorAll('.heading')) {
    const text = (heading.textContent ?? '').trim()
    if (!text.includes('输入参数'))
      continue
    let el = heading.nextElementSibling
    while (el) {
      if (el instanceof HTMLElement && el.classList.contains('input-container'))
        return el
      if (
        el instanceof HTMLElement
        && (el.classList.contains('heading') || el.classList.contains('setting-item'))
      )
        break
      el = el.nextElementSibling
    }
  }
  return body.querySelector<HTMLElement>('.input-container')
}

export function createCanvasSectionHeading(title: string): HTMLElement {
  const heading = document.createElement('div')
  heading.className = 'heading nopan nodrag'
  const h3 = document.createElement('h3')
  h3.className = 'flowgame-canvas-section-heading'
  h3.textContent = title
  heading.appendChild(h3)
  return heading
}

/** 将自定义区块紧挨在「输入参数」之后（输入参数在上、自定义区块在下） */
export function placeSectionAfterInputParameters(body: HTMLElement, section: HTMLElement) {
  const container = findParametersInputContainer(body)
  if (container) {
    if (section.previousElementSibling !== container)
      container.insertAdjacentElement('afterend', section)
    return
  }

  for (const heading of body.querySelectorAll('.heading')) {
    const text = (heading.textContent ?? '').trim()
    if (!text.includes('输入参数'))
      continue
    let last: Element = heading
    let el = heading.nextElementSibling
    while (el) {
      if (
        el instanceof HTMLElement
        && (
          el.classList.contains('heading')
          || el.classList.contains('flowgame-node-canvas-section')
        )
      )
        break
      last = el
      el = el.nextElementSibling
    }
    if (section.previousElementSibling !== last)
      last.insertAdjacentElement('afterend', section)
    return
  }

  if (section.parentElement !== body)
    body.appendChild(section)
}

export function ensureCanvasSection(
  body: HTMLElement,
  sectionClass: string,
  headingTitle: string,
  mountClass: string
): { section: HTMLElement, heading: HTMLElement, mount: HTMLElement } {
  let section = body.querySelector<HTMLElement>(`.${sectionClass}`)
  if (!section) {
    section = document.createElement('div')
    section.className = `flowgame-node-canvas-section ${sectionClass} nopan nodrag`
    const heading = createCanvasSectionHeading(headingTitle)
    const mount = document.createElement('div')
    mount.className = mountClass
    section.append(heading, mount)
  }

  placeSectionAfterInputParameters(body, section)

  const heading = section.querySelector<HTMLElement>('.heading')
  const mount = section.querySelector<HTMLElement>(`.${mountClass}`)
  if (!heading || !mount)
    throw new Error(`Invalid canvas section: ${sectionClass}`)

  const titleEl = heading.querySelector('h3.flowgame-canvas-section-heading, span')
  if (!titleEl) {
    const h3 = document.createElement('h3')
    h3.className = 'flowgame-canvas-section-heading'
    h3.textContent = headingTitle
    heading.replaceChildren(h3)
  }
  else if (titleEl.tagName === 'SPAN') {
    const h3 = document.createElement('h3')
    h3.className = 'flowgame-canvas-section-heading'
    h3.textContent = titleEl.textContent ?? headingTitle
    titleEl.replaceWith(h3)
  }

  return { section, heading, mount }
}
