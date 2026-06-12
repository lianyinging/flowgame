import type { CustomNode } from '@tinyflow-ai/ui'
import { joinAllNodeOutputDefs } from './join-node-output-defs'
import { JOIN_ALL_NODE_ICON } from './parallel-node-icons'

export const JOIN_ALL_NODE_TYPE = 'joinAllNode'

/** 汇聚（全部）：等待所有入边上游成功后再继续下游，仅执行一次 */
export const nodeJoinAll: CustomNode = {
  title: '汇聚（全部）',
  description:
    '等待所有并行分支执行完成且成功后，才触发下游节点一次；任一分支失败则汇聚失败',
  sortNo: 331,
  group: 'base',
  icon: JOIN_ALL_NODE_ICON,
  parameters: [],
  parametersEnable: false,
  parametersAddEnable: false,
  outputDefs: joinAllNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: []
}
