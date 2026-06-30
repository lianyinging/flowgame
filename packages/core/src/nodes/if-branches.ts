export type IfBranchType = 'if' | 'elseif' | 'else'

export interface IfBranchDef {
  id: string
  type: IfBranchType
  condition?: string
}

export const IF_ELSE_BRANCH_ID = 'else'

/** 兼容旧版二元分支 */
export const IF_LEGACY_TRUE_BRANCH_ID = 'true'
export const IF_LEGACY_FALSE_BRANCH_ID = 'false'

export function createIfBranchId(index: number) {
  return `branch-${index}`
}

export function ifBranchTypeLabel(type: IfBranchType, index: number) {
  if (type === 'if')
    return '如果'
  if (type === 'elseif')
    return '否则如果'
  return '否则'
}

export function defaultIfBranches(): IfBranchDef[] {
  return [
    { id: createIfBranchId(0), type: 'if', condition: '{{msg}} === \'success\'' },
    { id: IF_ELSE_BRANCH_ID, type: 'else' }
  ]
}

function normalizeBranchItem(raw: unknown, index: number): IfBranchDef | null {
  if (!raw || typeof raw !== 'object')
    return null
  const item = raw as Record<string, unknown>
  const type = item.type
  if (type !== 'if' && type !== 'elseif' && type !== 'else')
    return null
  const id = typeof item.id === 'string' && item.id.trim()
    ? item.id.trim()
    : (type === 'else' ? IF_ELSE_BRANCH_ID : createIfBranchId(index))
  const condition = typeof item.condition === 'string' ? item.condition : ''
  return {
    id,
    type,
    condition: type === 'else' ? undefined : condition
  }
}

/** 解析节点 branches；无 branches 时从旧版 condition 迁移 */
export function parseIfBranches(data: Record<string, unknown> | undefined): IfBranchDef[] {
  const raw = data?.branches
  if (Array.isArray(raw) && raw.length) {
    const parsed = raw
      .map((item, index) => normalizeBranchItem(item, index))
      .filter((item): item is IfBranchDef => Boolean(item))
    if (parsed.length) {
      const last = parsed[parsed.length - 1]
      if (last.type !== 'else') {
        parsed.push({ id: IF_ELSE_BRANCH_ID, type: 'else' })
      }
      return parsed
    }
  }

  const legacyCondition = data?.condition
  if (legacyCondition !== undefined && String(legacyCondition).trim()) {
    const cond = String(legacyCondition).trim() || 'true'
    return [
      { id: IF_LEGACY_TRUE_BRANCH_ID, type: 'if', condition: cond },
      { id: IF_LEGACY_FALSE_BRANCH_ID, type: 'else' }
    ]
  }

  return defaultIfBranches()
}

export function isLegacyIfBranches(branches: IfBranchDef[]) {
  return branches.length === 2
    && branches[0]?.id === IF_LEGACY_TRUE_BRANCH_ID
    && branches[1]?.id === IF_LEGACY_FALSE_BRANCH_ID
}

export function ifBranchSelectLabel(branch: IfBranchDef, index: number) {
  const prefix = ifBranchTypeLabel(branch.type, index)
  if (branch.type === 'else')
    return `${prefix}（${branch.id}）`
  const cond = (branch.condition ?? '').trim()
  const preview = cond.length > 24 ? `${cond.slice(0, 24)}…` : cond
  return preview ? `${prefix}：${preview}` : prefix
}

export function appendElseIfBranch(branches: IfBranchDef[]): IfBranchDef[] {
  const next = branches.filter(b => b.type !== 'else')
  const elseBranch = branches.find(b => b.type === 'else')
    ?? { id: IF_ELSE_BRANCH_ID, type: 'else' as const }
  const elseifIndex = next.length
  next.push({
    id: createIfBranchId(elseifIndex),
    type: 'elseif',
    condition: ''
  })
  next.push(elseBranch)
  return next
}

export function removeElseIfBranch(branches: IfBranchDef[], branchId: string): IfBranchDef[] {
  const target = branches.find(b => b.id === branchId)
  if (!target || target.type !== 'elseif')
    return branches
  const next = branches.filter(b => b.id !== branchId)
  if (!next.some(b => b.type === 'else')) {
    next.push({ id: IF_ELSE_BRANCH_ID, type: 'else' })
  }
  return next
}

export function upgradeLegacyIfBranches(branches: IfBranchDef[]): IfBranchDef[] {
  if (!isLegacyIfBranches(branches))
    return branches
  return [
    { id: createIfBranchId(0), type: 'if', condition: branches[0]?.condition ?? 'true' },
    { id: IF_ELSE_BRANCH_ID, type: 'else' }
  ]
}
