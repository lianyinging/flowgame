import type { CustomNode } from '@tinyflow-ai/ui'
import {
  mountMemoryWriteCanvasControls,
  updateMemoryWriteCanvasControls
} from './memory-write-canvas'
import {
  memoryWriteNodeDefaultParameters
} from './memory-node-parameters'
import { memoryWriteNodeOutputDefs } from './memory-node-output-defs'

export const MEMORY_WRITE_NODE_TYPE = 'memoryWriteNode'

const MEMORY_WRITE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 2h8v2H8V9zm0 4h5v2H8v-2z"/></svg>'

/** 记忆写入：RPUSH 到 flow_game:flow_context:{md5(contextKey)} */
export const nodeMemoryWrite: CustomNode = {
  title: '记忆写入',
  description:
    '支持多组 contextKey + memoryValue，分别 RPUSH 到 flow_game:flow_context:{MD5(上下文引用值)}',
  sortNo: 360,
  group: 'base',
  icon: MEMORY_WRITE_ICON,
  parameters: memoryWriteNodeDefaultParameters,
  /** 与记忆读取一致：引用值用 Tinyflow 内置树形下拉；画布仅额外挂「添加记忆组」 */
  parametersEnable: true,
  parametersAddEnable: false,
  outputDefs: memoryWriteNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    { type: 'heading', label: 'Redis 列表' },
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
