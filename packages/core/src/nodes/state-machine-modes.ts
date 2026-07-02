export const STATE_MACHINE_MODES = [
  { label: '写入', value: 'write' },
  { label: '读取', value: 'read' },
  { label: '删除', value: 'delete' },
  { label: '更新', value: 'update' }
] as const

export type StateMachineMode = (typeof STATE_MACHINE_MODES)[number]['value']

export const DEFAULT_STATE_MACHINE_MODE: StateMachineMode = 'write'

export function isStateMachineMode(value: unknown): value is StateMachineMode {
  return value === 'write' || value === 'read' || value === 'delete' || value === 'update'
}

export function readStateMachineMode(data: Record<string, unknown> | undefined): StateMachineMode {
  const raw = data?.mode
  return isStateMachineMode(raw) ? raw : DEFAULT_STATE_MACHINE_MODE
}
