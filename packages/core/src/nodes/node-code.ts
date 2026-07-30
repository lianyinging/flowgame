import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import {
  CODE_NODE_CODE_PLACEHOLDER,
  CODE_NODE_ENGINE_OPTIONS,
  CODE_NODE_TYPE,
  DEFAULT_CODE_NODE_CODE,
  DEFAULT_CODE_NODE_ENGINE
} from '../inspector/code-node-inspector'
import { BUILTIN_NODE_ICONS } from '../inspector/node-type-icons'

/**
 * 覆盖 Tinyflow 内置 codeNode：
 * 内置组件会默认 engine=qlexpress，并提供 Groovy/QLExpress，与 FlowGame 后端不符。
 * 通过 customNodes.codeNode 覆盖节点渲染为通用表单，仅保留 JavaScript / Python。
 */
export const nodeCode: CustomNode = {
  title: '动态代码',
  description: '动态执行 JavaScript 或 Python，返回对象作为节点输出',
  sortNo: 701,
  group: 'base',
  icon: BUILTIN_NODE_ICONS.codeNode,
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefsEnable: true,
  outputDefsAddEnable: true,
  forms: [
    nodeFormHeading('代码'),
    {
      type: 'select',
      name: 'engine',
      label: '执行引擎',
      defaultValue: DEFAULT_CODE_NODE_ENGINE,
      options: CODE_NODE_ENGINE_OPTIONS.map(o => ({ label: o.label, value: o.value })),
      description: 'JavaScript 用 IIFE 并 return 对象；Python 请赋值 result = {...}'
    },
    {
      type: 'textarea',
      name: 'code',
      label: '执行代码',
      placeholder: CODE_NODE_CODE_PLACEHOLDER,
      defaultValue: DEFAULT_CODE_NODE_CODE,
      description: CODE_NODE_CODE_PLACEHOLDER
    }
  ]
}

export { CODE_NODE_TYPE }
