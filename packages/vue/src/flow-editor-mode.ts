import type { FlowEditorFormMode } from './types'

export const FLOW_EDITOR_MODE_LABEL: Record<FlowEditorFormMode, string> = {
  add: '新增',
  edit: '编辑',
  view: '查看'
}

export function resolveInitialEditorFormMode(options: {
  readonly?: boolean
  redisKey?: string
  flowName?: string
}): FlowEditorFormMode {
  if (options.readonly)
    return 'view'
  const hasFlow = Boolean(options.redisKey?.trim() || options.flowName?.trim())
  return hasFlow ? 'edit' : 'add'
}

export function displayFlowEditorName(flowName: string, mode: FlowEditorFormMode): string {
  const trimmed = flowName.trim()
  if (trimmed)
    return trimmed
  return mode === 'add' ? '未命名流程' : '未命名流程'
}
