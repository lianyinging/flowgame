import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/** 默认入参示例；可在侧栏/画布继续添加，占位符使用 {{ 参数名称 }} */
export const htmlTemplateNodeDefaultParameters: Parameter[] = [
  {
    id: newParameterId('html_in'),
    name: 'content',
    nameDisabled: true,
    deleteDisabled: true,
    dataType: 'String',
    refType: 'ref',
    ref: '',
    required: false,
    description: '模板占位符 {{ content }} 将替换为引用值'
  }
]
