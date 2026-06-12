import type { CustomNode } from '@tinyflow-ai/ui'
import { joinAnyNodeOutputDefs } from './join-node-output-defs'
import { JOIN_ANY_NODE_ICON } from './parallel-node-icons'

export const JOIN_ANY_NODE_TYPE = 'joinAnyNode'

/** 汇聚（任一）：首个成功分支触发下游，仅执行一次 */
export const nodeJoinAny: CustomNode = {
  title: '汇聚（任一）',
  description:
    '任一并行分支成功即触发下游一次；若全部分支均失败则汇聚失败',
  sortNo: 332,
  group: 'base',
  icon: JOIN_ANY_NODE_ICON,
  parameters: [],
  parametersEnable: false,
  parametersAddEnable: false,
  outputDefs: joinAnyNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: []
}
