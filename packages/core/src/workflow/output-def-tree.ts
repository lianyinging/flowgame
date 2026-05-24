import type { FlowParameter } from '../inspector/node-inspector-config'
import { cloneParameters, newParameterId } from '../inspector/node-inspector-config'

export function getOutputDefAt(root: FlowParameter[], path: number[]): FlowParameter | null {
  let current: FlowParameter | undefined
  let list = root
  for (const idx of path) {
    current = list[idx]
    if (!current)
      return null
    list = current.children ?? []
  }
  return current ?? null
}

export function updateOutputDefAt(
  root: FlowParameter[],
  path: number[],
  patch: Partial<FlowParameter>
): FlowParameter[] {
  const next = cloneParameters(root)
  const list = resolveParentList(next, path)
  const idx = path[path.length - 1]
  if (!list || idx === undefined || !list[idx])
    return next
  list[idx] = { ...list[idx], ...patch }
  return next
}

export function removeOutputDefAt(root: FlowParameter[], path: number[]): FlowParameter[] {
  const next = cloneParameters(root)
  const list = resolveParentList(next, path)
  const idx = path[path.length - 1]
  if (!list || idx === undefined)
    return next
  list.splice(idx, 1)
  return next
}

export function addChildOutputDefAt(root: FlowParameter[], path: number[]): FlowParameter[] {
  const next = cloneParameters(root)
  const param = getOutputDefAt(next, path)
  if (!param)
    return next
  const list = resolveParentList(next, path)
  const idx = path[path.length - 1]
  if (!list || idx === undefined)
    return next
  const children = [...(list[idx].children ?? [])]
  children.push({
    id: newParameterId('out'),
    name: 'newParam',
    dataType: 'String'
  })
  list[idx] = { ...list[idx], children }
  return next
}

function resolveParentList(root: FlowParameter[], path: number[]): FlowParameter[] | null {
  if (!path.length)
    return null
  let list = root
  for (let i = 0; i < path.length - 1; i++) {
    const node = list[path[i]]
    if (!node?.children)
      return null
    list = node.children
  }
  return list
}
