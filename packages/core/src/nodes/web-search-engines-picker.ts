import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import {
  DEFAULT_WEB_SEARCH_ENGINES,
  WEB_SEARCH_ENGINE_OPTIONS,
  normalizeWebSearchEngines
} from './web-search-engines'

export const WEB_SEARCH_ENGINES_PICKER_CLASS = 'flowgame-web-search-engines-picker'

type FlowApi = ReturnType<typeof useSvelteFlow>

function readEngines(node: Node): string[] {
  const data = (node.data ?? {}) as Record<string, unknown>
  return normalizeWebSearchEngines(data.engines)
}

function writeEngines(flow: FlowApi, node: Node, engines: string[]) {
  const next = normalizeWebSearchEngines(engines)
  flow.updateNodeData(node.id, { engines: next })
}

function renderCheckboxes(
  host: HTMLElement,
  selected: string[],
  onToggle: (value: string, checked: boolean) => void
) {
  host.replaceChildren()
  for (const opt of WEB_SEARCH_ENGINE_OPTIONS) {
    const row = document.createElement('label')
    row.className = 'flowgame-web-search-engine-row'
    row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin:6px 0;cursor:pointer;font-size:12px;line-height:1.4;'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.className = 'nodrag'
    input.value = opt.value
    input.checked = selected.includes(opt.value)
    input.addEventListener('change', (e) => {
      e.stopPropagation()
      onToggle(opt.value, input.checked)
    })
    input.addEventListener('click', e => e.stopPropagation())

    const text = document.createElement('span')
    text.style.cssText = 'display:flex;flex-direction:column;gap:2px;'
    const label = document.createElement('span')
    label.textContent = opt.label
    label.style.fontWeight = '500'
    text.appendChild(label)
    if (opt.description) {
      const desc = document.createElement('span')
      desc.textContent = opt.description
      desc.style.cssText = 'color:var(--color-text-3, #86909c);font-size:11px;'
      text.appendChild(desc)
    }

    row.appendChild(input)
    row.appendChild(text)
    host.appendChild(row)
  }
}

/**
 * 在画布节点「搜索引擎设置」标题下挂载引擎列表。
 * Tinyflow 无原生 multi-select，故用自定义 checkbox（当前仅腾讯新闻）。
 */
export function mountWebSearchEnginesPicker(
  parent: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  let host = parent.querySelector<HTMLElement>(`.${WEB_SEARCH_ENGINES_PICKER_CLASS}`)
  if (!host) {
    host = document.createElement('div')
    host.className = WEB_SEARCH_ENGINES_PICKER_CLASS
    host.style.cssText = 'padding:4px 0 8px;'
    parent.appendChild(host)
  }

  const selected = readEngines(node)
  const rawEngines = (node.data as Record<string, unknown> | undefined)?.engines
  if (!Array.isArray(rawEngines) || !rawEngines.length)
    writeEngines(flow, node, [...DEFAULT_WEB_SEARCH_ENGINES])
  else if (JSON.stringify(rawEngines) !== JSON.stringify(selected))
    writeEngines(flow, node, selected)

  renderCheckboxes(host, selected, (value, checked) => {
    const current = readEngines(node)
    const next = checked
      ? [...current, value]
      : current.filter(id => id !== value)
    writeEngines(flow, node, next.length ? next : [...DEFAULT_WEB_SEARCH_ENGINES])
  })
}

export function updateWebSearchEnginesPicker(parent: HTMLElement, node: Node) {
  const host = parent.querySelector<HTMLElement>(`.${WEB_SEARCH_ENGINES_PICKER_CLASS}`)
  if (!host)
    return
  const selected = readEngines(node)
  for (const input of host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    input.checked = selected.includes(input.value)
}
