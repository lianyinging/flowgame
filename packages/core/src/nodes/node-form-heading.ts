import type { CustomNodeForm } from '@tinyflow-ai/ui'

/** Tinyflow 要求 heading 也带 name；运行时不使用，仅满足类型与表单 schema */
export function nodeFormHeading(label: string, name?: string): CustomNodeForm {
  return {
    type: 'heading',
    label,
    name: name ?? `__heading_${label.replace(/\s+/g, '_')}`
  }
}
