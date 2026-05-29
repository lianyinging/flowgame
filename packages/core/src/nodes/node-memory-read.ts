import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import {
  memoryReadNodeDefaultParameters
} from './memory-node-parameters'
import { memoryReadNodeOutputDefs } from './memory-node-output-defs'

export const MEMORY_READ_NODE_TYPE = 'memoryReadNode'

const MEMORY_READ_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm3 2h6v2h-6V9zm0 4h4v2H9v-2zm5 0h2v2h-2v-2z"/></svg>'

/** 记忆提取：LRANGE 读取 flow_game:flow_context:{md5(contextKey)} */
export const nodeMemoryRead: CustomNode = {
  title: '记忆提取',
  description:
    '从 Redis 列表读取记忆；键规则与「记忆写入」一致（上下文引用值 MD5）',
  sortNo: 361,
  group: 'base',
  icon: MEMORY_READ_ICON,
  parameters: memoryReadNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: false,
  outputDefs: memoryReadNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('读取配置'),
    {
      type: 'input',
      name: 'readLimit',
      label: '默认读取条数',
      placeholder: '50',
      defaultValue: '50',
      description: '可在输入参数 readLimit 中覆盖；0 表示读取全部'
    }
  ]
}
