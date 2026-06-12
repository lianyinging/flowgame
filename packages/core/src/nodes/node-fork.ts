import type { CustomNode } from '@tinyflow-ai/ui'
import { forkNodeOutputDefs } from './join-node-output-defs'
import { FORK_NODE_ICON } from './parallel-node-icons'

export const FORK_NODE_TYPE = 'forkNode'

/** 分叉：同时启动所有出边分支（后端强制并行执行） */
export const nodeFork: CustomNode = {
  title: '并行分叉',
  description: '将流程拆分为多条并行分支；通常与「汇聚（全部/任一）」配合使用',
  sortNo: 330,
  group: 'base',
  icon: FORK_NODE_ICON,
  parameters: [],
  parametersEnable: false,
  parametersAddEnable: false,
  outputDefs: forkNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: []
}
