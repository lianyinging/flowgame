import type { CustomNodeForm } from '@tinyflow-ai/ui'
import { readStateMachineMode, type StateMachineMode } from './state-machine-modes'

/** 与 node-state-machine forms 的 label 保持一致，供画布 DOM 匹配 */
export const STATE_MACHINE_FORM_LABEL_BY_NAME: Record<string, string> = {
  namespace: '命名空间',
  keyTemplate: 'Key 模板',
  expireSeconds: '过期时间（秒）',
  refreshTtl: '写入时刷新 TTL',
  defaultStatus: '读取默认 status',
  failIfMissing: 'Key 不存在时报错',
  returnLastState: '删除前返回最后状态'
}

const COMMON_FIELDS = new Set(['namespace', 'keyTemplate'])

const MODE_FORM_FIELDS: Record<StateMachineMode, ReadonlySet<string>> = {
  write: new Set([...COMMON_FIELDS, 'expireSeconds', 'refreshTtl']),
  read: new Set([...COMMON_FIELDS, 'defaultStatus', 'failIfMissing']),
  delete: new Set([...COMMON_FIELDS, 'failIfMissing', 'returnLastState']),
  update: new Set([...COMMON_FIELDS, 'expireSeconds', 'refreshTtl', 'failIfMissing'])
}

export function visibleStateMachineFormFieldNames(
  mode: StateMachineMode | ReturnType<typeof readStateMachineMode>
): ReadonlySet<string> {
  return MODE_FORM_FIELDS[mode] ?? MODE_FORM_FIELDS.write
}

export function isStateMachineFormFieldVisible(
  fieldName: string,
  mode: StateMachineMode | ReturnType<typeof readStateMachineMode>
): boolean {
  return visibleStateMachineFormFieldNames(mode).has(fieldName)
}

/** 侧栏：按模式过滤 Redis 状态表单项（保留 heading） */
export function filterStateMachineInspectorForms(
  forms: CustomNodeForm[],
  data: Record<string, unknown> | undefined
): CustomNodeForm[] {
  const mode = readStateMachineMode(data)
  const visible = visibleStateMachineFormFieldNames(mode)
  return forms.filter(f => f.type === 'heading' || (f.name && visible.has(f.name)))
}

/** 画布：按模式显示/隐藏 setting-title + setting-item */
export function syncStateMachineCanvasFormVisibility(
  body: HTMLElement,
  data: Record<string, unknown> | undefined
): void {
  const mode = readStateMachineMode(data)
  const visible = visibleStateMachineFormFieldNames(mode)
  const labelByName = STATE_MACHINE_FORM_LABEL_BY_NAME

  for (const [name, label] of Object.entries(labelByName)) {
    const show = visible.has(name)
    for (const titleEl of body.querySelectorAll('.setting-title')) {
      if ((titleEl.textContent ?? '').trim() !== label)
        continue
      const title = titleEl as HTMLElement
      title.style.display = show ? '' : 'none'
      const item = title.nextElementSibling
      if (item instanceof HTMLElement && item.classList.contains('setting-item'))
        item.style.display = show ? '' : 'none'
    }
  }
}
