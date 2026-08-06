import type { Node } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import {
  DEFAULT_LLMAPI_MODEL_NAME,
  DEFAULT_LLMAPI_PROVIDER,
  LLMAPI_PROVIDER_OPTIONS,
  getLlmApiModelOptions,
  isLlmApiTemplateValue,
  normalizeLlmApiProvider,
  resolveLlmApiModelForProvider
} from './llmapi-providers'
import { buildLlmApiProviderModelPatch } from './llmapi-param-sync'

export const LLMAPI_PROVIDER_MODEL_PICKER_CLASS = 'flowgame-llmapi-provider-model-picker'

type FlowApi = ReturnType<typeof useSvelteFlow>
type Opt = { label: string, value: string }
type PickerHost = HTMLElement & { __flow?: FlowApi }

function readProviderModel(node: Node): { modelProvider: string, modelName: string } {
  const data = (node.data ?? {}) as Record<string, unknown>
  const rawProvider = String(data.modelProvider || '').trim() || DEFAULT_LLMAPI_PROVIDER
  const modelProvider = isLlmApiTemplateValue(rawProvider)
    ? rawProvider
    : normalizeLlmApiProvider(rawProvider)
  const rawModel = String(data.modelName || '').trim()
  const modelName = isLlmApiTemplateValue(rawModel) || isLlmApiTemplateValue(modelProvider)
    ? (rawModel || (isLlmApiTemplateValue(modelProvider) ? '{{modelName}}' : DEFAULT_LLMAPI_MODEL_NAME))
    : resolveLlmApiModelForProvider(modelProvider, rawModel)
  return { modelProvider, modelName }
}

function writeProviderModel(
  flow: FlowApi,
  node: Node,
  modelProvider: string,
  modelName: string
) {
  const data = (node.data ?? {}) as Record<string, unknown>
  const patch = buildLlmApiProviderModelPatch(data, { modelProvider, modelName })
  flow.updateNodeData(node.id, patch)
}

function addFieldLabel(host: HTMLElement, text: string) {
  const title = document.createElement('div')
  title.className = 'setting-title'
  title.textContent = text
  host.appendChild(title)
}

function addFieldDesc(host: HTMLElement, text: string) {
  const desc = document.createElement('p')
  desc.className = 'tf-node-panel__field-desc'
  desc.style.cssText = 'margin:4px 0 8px;font-size:11px;color:var(--color-text-3, #86909c);line-height:1.4;'
  desc.textContent = text
  host.appendChild(desc)
}

function styleInput(el: HTMLInputElement) {
  el.className = 'nodrag nowheel'
  el.style.cssText = [
    'width:100%',
    'box-sizing:border-box',
    'min-height:36px',
    'padding:6px 10px',
    'border:1px solid var(--tf-input, #e2e8f0)',
    'border-radius:calc(var(--tf-radius, 14px) * 0.8)',
    'background:var(--color-bg-2, #fff)',
    'box-shadow:0 1px 2px rgba(0,0,0,0.05)',
    'font-size:13px',
    'color:var(--color-text-1, #1d2129)',
    'outline:none'
  ].join(';')
}

function fillDatalist(list: HTMLDataListElement, options: readonly Opt[]) {
  list.replaceChildren()
  for (const opt of options) {
    const option = document.createElement('option')
    option.value = opt.value
    option.label = opt.label
    list.appendChild(option)
  }
}

function createSuggestInput(
  host: HTMLElement,
  listId: string,
  options: readonly Opt[],
  value: string,
  placeholder: string,
  onCommit: (value: string) => void
) {
  const input = document.createElement('input')
  styleInput(input)
  input.setAttribute('list', listId)
  input.placeholder = placeholder
  input.value = value

  const list = document.createElement('datalist')
  list.id = listId
  fillDatalist(list, options)

  const commit = () => {
    const next = input.value.trim()
    if (next !== value)
      onCommit(next)
  }
  input.addEventListener('change', (e) => {
    e.stopPropagation()
    commit()
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      input.blur()
      commit()
    }
  })
  input.addEventListener('click', e => e.stopPropagation())
  input.addEventListener('mousedown', e => e.stopPropagation())

  host.appendChild(input)
  host.appendChild(list)
  return input
}

function renderFields(host: PickerHost, node: Node, flow: FlowApi) {
  const { modelProvider, modelName } = readProviderModel(node)
  const data = (node.data ?? {}) as Record<string, unknown>
  if (
    String(data.modelProvider || '').trim() !== modelProvider
    || String(data.modelName || '').trim() !== modelName
  )
    writeProviderModel(flow, node, modelProvider, modelName)

  host.replaceChildren()
  const uid = String(node.id || 'llmapi').replace(/[^\w-]/g, '_')

  addFieldLabel(host, '模型厂家')
  createSuggestInput(
    host,
    `llmapi-provider-${uid}`,
    LLMAPI_PROVIDER_OPTIONS,
    modelProvider,
    '选择或输入，如 {{modelProvider}}',
    (next) => {
      const nextModel = isLlmApiTemplateValue(next)
        ? (isLlmApiTemplateValue(modelName) ? modelName : '{{modelName}}')
        : resolveLlmApiModelForProvider(next, isLlmApiTemplateValue(modelName) ? undefined : modelName)
      writeProviderModel(flow, node, next || DEFAULT_LLMAPI_PROVIDER, nextModel)
    }
  )
  addFieldDesc(host, '可下拉选择，也可输入 {{modelProvider}}；执行时用同名入参替换')

  addFieldLabel(host, '模型名称')
  const modelOpts = getLlmApiModelOptions(modelProvider)
  const modelOptList = modelName && !modelOpts.some(o => o.value === modelName)
    ? [{ label: modelName, value: modelName }, ...modelOpts]
    : modelOpts
  createSuggestInput(
    host,
    `llmapi-model-${uid}`,
    modelOptList,
    modelName,
    '选择或输入，如 {{modelName}}',
    (next) => {
      writeProviderModel(flow, node, modelProvider, next)
    }
  )
  addFieldDesc(host, '可下拉选择，也可输入 {{modelName}}；API Key 支持 {{apiKey}}')
}

function resolveMountRoot(host: HTMLElement): HTMLElement {
  return (host.closest('.tf-node-wrapper-body') as HTMLElement | null) ?? host
}

function findProviderModelHeading(body: HTMLElement): HTMLElement | null {
  for (const heading of body.querySelectorAll('.heading')) {
    const text = (heading.textContent ?? '').trim()
    if (text.includes('模型厂家与名称'))
      return heading as HTMLElement
  }
  return null
}

function placePickerHost(body: HTMLElement, host: HTMLElement) {
  const heading = findProviderModelHeading(body)
  if (heading) {
    if (host.previousElementSibling !== heading)
      heading.insertAdjacentElement('afterend', host)
    return
  }
  for (const title of body.querySelectorAll('.setting-title')) {
    if ((title.textContent ?? '').trim() !== 'API Key')
      continue
    if (host.nextElementSibling !== title)
      title.insertAdjacentElement('beforebegin', host)
    return
  }
  if (!host.isConnected)
    body.prepend(host)
}

/**
 * 画布：厂家/模型支持下拉建议 + 手填 {{param}}。
 */
export function mountLlmApiProviderModelPicker(
  parent: HTMLElement,
  node: Node,
  flow: FlowApi
) {
  const body = resolveMountRoot(parent)
  let host = body.querySelector<PickerHost>(`.${LLMAPI_PROVIDER_MODEL_PICKER_CLASS}`)
  if (!host) {
    host = document.createElement('div') as PickerHost
    host.className = LLMAPI_PROVIDER_MODEL_PICKER_CLASS
    host.style.cssText = 'padding:4px 0 8px;width:100%;box-sizing:border-box;'
  }
  placePickerHost(body, host)
  host.__flow = flow
  renderFields(host, node, flow)
}

export function updateLlmApiProviderModelPicker(parent: HTMLElement, node: Node) {
  const body = resolveMountRoot(parent)
  const host = body.querySelector<PickerHost>(`.${LLMAPI_PROVIDER_MODEL_PICKER_CLASS}`)
  if (!host?.__flow)
    return
  placePickerHost(body, host)
  renderFields(host, node, host.__flow)
}
