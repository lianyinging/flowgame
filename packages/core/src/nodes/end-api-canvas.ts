import type { Node as FlowNode } from '@xyflow/svelte'
import type { useSvelteFlow } from '@xyflow/svelte'
import { syncEndApiFromParameters } from '../workflow/end-api-param-sync'

type FlowApi = ReturnType<typeof useSvelteFlow>

const flowByHost = new WeakMap<HTMLElement, FlowApi>()

function renameInputParamsHeading(body: HTMLElement) {
  for (const heading of body.querySelectorAll('.heading')) {
    const h3 = heading.querySelector('h3')
    if (h3 && (h3.textContent ?? '').trim() === '输入参数') {
      h3.textContent = '输出参数'
      continue
    }
    const text = (heading.textContent ?? '').trim()
    if (text === '输入参数')
      heading.textContent = '输出参数'
  }
}

/** 画布：标题改为「输出参数」，并把 parameters 同步到 outputDefs */
export function syncEndApiCanvasParams(
  parent: HTMLElement,
  node: FlowNode,
  flow?: FlowApi
) {
  if (flow)
    flowByHost.set(parent, flow)

  const body = (parent.closest('.tf-node-wrapper-body') as HTMLElement | null) ?? parent
  renameInputParamsHeading(body)

  const api = flow ?? flowByHost.get(parent)
  if (!api)
    return

  const live = api.getNodes?.().find(n => n.id === node.id) ?? node
  const data = { ...((live.data ?? {}) as Record<string, unknown>) }
  const synced = syncEndApiFromParameters(data)
  if (
    JSON.stringify(synced.parameters ?? []) === JSON.stringify(data.parameters ?? [])
    && JSON.stringify(synced.outputDefs ?? []) === JSON.stringify(data.outputDefs ?? [])
  ) {
    return
  }

  api.updateNodeData(node.id, {
    parameters: synced.parameters,
    outputDefs: synced.outputDefs
  })
}
