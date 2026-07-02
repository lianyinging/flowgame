import type { Parameter } from '@tinyflow-ai/ui'
import { readStateMachineMode, type StateMachineMode } from './state-machine-modes'
import { defaultStateParametersForMode } from '../workflow/normalize-state-node-params'

export function stateMachineBuiltinParamNames(
  mode: StateMachineMode | ReturnType<typeof readStateMachineMode>
): Set<string> {
  return new Set(
    defaultStateParametersForMode(mode)
      .map(p => p.name)
      .filter((name): name is string => Boolean(name))
  )
}

export function isStateMachineBuiltinParam(
  name: string | undefined,
  mode: StateMachineMode | ReturnType<typeof readStateMachineMode>
): boolean {
  if (!name)
    return false
  return stateMachineBuiltinParamNames(mode).has(name)
}

export function partitionStateMachineParameters<T extends Parameter>(
  parameters: T[],
  mode: StateMachineMode | ReturnType<typeof readStateMachineMode>
): { customRows: Array<{ index: number, param: T }>, defaultRows: Array<{ index: number, param: T }> } {
  const builtin = stateMachineBuiltinParamNames(mode)
  const customRows: Array<{ index: number, param: T }> = []
  const defaultRows: Array<{ index: number, param: T }> = []
  parameters.forEach((param, index) => {
    const row = { index, param }
    if (param.name && builtin.has(param.name))
      defaultRows.push(row)
    else
      customRows.push(row)
  })
  return { customRows, defaultRows }
}

/** 切换模式：替换内置入参，保留用户自定义入参（+ 添加） */
export function mergeStateParametersForModeChange<T extends Parameter>(
  existing: T[] | undefined,
  mode: StateMachineMode | ReturnType<typeof readStateMachineMode>
): T[] {
  const defaults = defaultStateParametersForMode(mode) as T[]
  const builtin = stateMachineBuiltinParamNames(mode)
  const custom = (existing ?? []).filter(p => p.name && !builtin.has(p.name))
  return [...defaults, ...custom]
}
