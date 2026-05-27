import {
  newParameterId,
  type FlowParameter
} from '../inspector/node-inspector-config'

/** 第 1 组：contextKey / memoryValue；第 2 组起：contextKey2、memoryValue2 … */
export function contextKeyParamName(suffix: string): string {
  return suffix === '1' ? 'contextKey' : `contextKey${suffix}`
}

export function memoryValueParamName(suffix: string): string {
  return suffix === '1' ? 'memoryValue' : `memoryValue${suffix}`
}

export interface MemoryWriteGroupView {
  suffix: string
  contextKeyIndex: number
  memoryValueIndex: number
}

export function parseMemoryWriteGroups(
  params: FlowParameter[]
): MemoryWriteGroupView[] {
  const contextBySuffix = new Map<string, number>()
  const valueBySuffix = new Map<string, number>()

  params.forEach((param, index) => {
    const name = (param.name || '').trim()
    const ctx = name.match(/^contextKey(\d*)$/)
    if (ctx) {
      const suffix = ctx[1] || '1'
      contextBySuffix.set(suffix, index)
    }
    const val = name.match(/^memoryValue(\d*)$/)
    if (val) {
      const suffix = val[1] || '1'
      valueBySuffix.set(suffix, index)
    }
  })

  const suffixes = new Set([
    ...contextBySuffix.keys(),
    ...valueBySuffix.keys()
  ])

  return [...suffixes]
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .filter(suffix => contextBySuffix.has(suffix) && valueBySuffix.has(suffix))
    .map(suffix => ({
      suffix,
      contextKeyIndex: contextBySuffix.get(suffix)!,
      memoryValueIndex: valueBySuffix.get(suffix)!
    }))
}

export function createMemoryWriteGroupPair(suffix: string): FlowParameter[] {
  const ctxName = contextKeyParamName(suffix)
  const valName = memoryValueParamName(suffix)
  return [
    {
      id: newParameterId('ctx'),
      name: ctxName,
      nameDisabled: true,
      deleteDisabled: true,
      dataType: 'String',
      refType: 'ref',
      ref: '',
      required: true,
      description: ''
    },
    {
      id: newParameterId('mem'),
      name: valName,
      nameDisabled: true,
      deleteDisabled: true,
      dataType: 'String',
      refType: 'ref',
      ref: '',
      required: true,
      description: ''
    }
  ]
}

export function defaultMemoryWriteParameters(): FlowParameter[] {
  return createMemoryWriteGroupPair('1')
}

export function appendMemoryWriteGroup(params: FlowParameter[]): FlowParameter[] {
  const groups = parseMemoryWriteGroups(params)
  const nextSuffix =
    groups.length === 0
      ? '1'
      : String(
          Math.max(...groups.map(g => Number.parseInt(g.suffix, 10) || 1)) + 1
        )
  return [...params, ...createMemoryWriteGroupPair(nextSuffix)]
}

export function removeMemoryWriteGroupBySuffix(
  params: FlowParameter[],
  suffix: string
): FlowParameter[] {
  const ctxName = contextKeyParamName(suffix)
  const valName = memoryValueParamName(suffix)
  return params.filter(p => p.name !== ctxName && p.name !== valName)
}
