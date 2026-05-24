import type { Node } from '@xyflow/svelte'

const ROOT_CLASS = 'flowgame-method-key-root'

/** 用只读文本展示 methodKey（不使用 input，避免 Tinyflow 表单仍可输入） */
export function renderMethodKeyDisplay(parent: HTMLElement, node: Node) {
  let root = parent.querySelector(`.${ROOT_CLASS}`) as HTMLElement | null
  if (!root) {
    root = document.createElement('div')
    root.className = ROOT_CLASS

    const title = document.createElement('div')
    // title.className = 'setting-title'
    // title.textContent = 'methodKey'

    const item = document.createElement('div')
    item.className = 'setting-item flowgame-method-key-display-wrap'

    const display = document.createElement('div')
    display.className = 'flowgame-method-key-display'
    item.appendChild(display)

    const hint = document.createElement('div')
    hint.className = 'flowgame-method-key-hint'
    hint.textContent = '外部调用 /siyu/flowGame/execute 时传此字段'

    // root.append(title, item, hint)

    const apiHeading = parent.querySelector('.heading')
    if (apiHeading)
      apiHeading.insertAdjacentElement('afterend', root)
    else
      parent.prepend(root)
  }

  const display = root.querySelector('.flowgame-method-key-display')
  const value = String((node.data as Record<string, unknown>)?.methodKey ?? '').trim()
  if (display)
    display.textContent = value || '（请先填写流程名称）'

  // 兼容旧版配置里残留的 input
  parent.querySelectorAll('input').forEach((el) => {
    const item = el.closest('.setting-item')
    const label = item?.previousElementSibling
    if (label?.textContent?.trim() === 'methodKey') {
      item?.remove()
      label.remove()
    }
  })
}
