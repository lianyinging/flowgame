import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import {
  mountMemoryWriteCanvasControls,
  updateMemoryWriteCanvasControls
} from './memory-write-canvas'
import {
  memoryWriteNodeDefaultParameters
} from './memory-node-parameters'
import { memoryWriteNodeOutputDefs } from './memory-node-output-defs'
import { MEMORY_WRITE_NODE_ICON } from './memory-node-icons'

export const MEMORY_WRITE_NODE_TYPE = 'memoryWriteNode'

/** 记忆写入：RPUSH 到 flow_game:flow_context:{md5(contextKey)} */
export const nodeMemoryWrite: CustomNode = {
  title: '记忆写入',
  description:
    '支持多组 contextKey + memoryValue，分别 RPUSH 到 flow_game:flow_context:{MD5(上下文引用值)}',
  sortNo: 360,
  group: 'base',
  icon: MEMORY_WRITE_NODE_ICON,
  parameters: memoryWriteNodeDefaultParameters,
  /** 与记忆读取一致：引用值用 Tinyflow 内置树形下拉；画布仅额外挂「添加记忆组」 */
  parametersEnable: true,
  parametersAddEnable: false,
  outputDefs: memoryWriteNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('Redis 列表'),
    {
      type: 'input',
      name: 'maxListSize',
      label: '列表最大条数',
      placeholder: '0 表示不裁剪',
      defaultValue: '100',
      description: '超过后保留最新 N 条（LTRIM）'
    },
    {
      type: 'input',
      name: 'expireSeconds',
      label: '过期时间（秒）',
      placeholder: '0 表示不过期',
      defaultValue: '0'
    }
  ],
  render: (parent, node, flow) => {
    mountMemoryWriteCanvasControls(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    updateMemoryWriteCanvasControls(parent, node)
  }
}
