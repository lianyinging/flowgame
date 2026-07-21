import type { FlowParameter } from '../inspector/node-inspector-config'
import { cloneParameters } from '../inspector/node-inspector-config'

/** 与 workflow-talk-rules 中 ASSISTANT_MESSAGE_OUTPUT_NAME 保持一致 */
const ASSISTANT_MESSAGE_OUTPUT_NAME = 'assistantMessage'

function resolveDataType(p: FlowParameter): string {
  const name = String(p.name ?? '').trim()
  // 对话页要求 assistantMessage 为 Object；画布参数表默认常为 String
  if (name === ASSISTANT_MESSAGE_OUTPUT_NAME)
    return 'Object'
  return p.dataType || 'String'
}

function toParamRow(p: FlowParameter): FlowParameter {
  return {
    ...p,
    dataType: resolveDataType(p),
    refType: (p.refType as string) || 'ref',
    ref: p.ref ?? '',
    value: p.value
  }
}

function toOutputRow(p: FlowParameter): FlowParameter {
  return {
    ...p,
    dataType: resolveDataType(p),
    refType: (p.refType as string) || 'ref',
    ref: p.ref ?? '',
    value: p.value
  }
}

/** 以 parameters 为准，回写 outputDefs（画布编辑后） */
export function syncEndApiFromParameters(data: Record<string, unknown>): Record<string, unknown> {
  const parameters = cloneParameters(data.parameters as FlowParameter[] | undefined).map(toParamRow)
  const outputDefs = parameters.map(toOutputRow)
  if (
    JSON.stringify(parameters) === JSON.stringify(data.parameters ?? [])
    && JSON.stringify(outputDefs) === JSON.stringify(data.outputDefs ?? [])
  ) {
    return data
  }
  return { ...data, parameters, outputDefs }
}

/** 以 outputDefs 为准，回写 parameters（侧栏编辑后） */
export function syncEndApiFromOutputDefs(data: Record<string, unknown>): Record<string, unknown> {
  const outputDefs = cloneParameters(data.outputDefs as FlowParameter[] | undefined).map(toOutputRow)
  const parameters = outputDefs.map(toParamRow)
  if (
    JSON.stringify(parameters) === JSON.stringify(data.parameters ?? [])
    && JSON.stringify(outputDefs) === JSON.stringify(data.outputDefs ?? [])
  ) {
    return data
  }
  return { ...data, parameters, outputDefs }
}

/**
 * 加载/归一化：两边对齐。
 * 优先 parameters（画布可引用上游）；仅有 outputDefs 时回填 parameters。
 */
export function syncEndApiParamsAndOutputDefs(data: Record<string, unknown>): Record<string, unknown> {
  const parameters = cloneParameters(data.parameters as FlowParameter[] | undefined)
  const outputDefs = cloneParameters(data.outputDefs as FlowParameter[] | undefined)
  if (parameters.length)
    return syncEndApiFromParameters(data)
  if (outputDefs.length)
    return syncEndApiFromOutputDefs(data)
  return data
}
