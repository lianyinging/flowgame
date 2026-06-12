import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import {
  memoryReadNodeDefaultParameters
} from './memory-node-parameters'
import { memoryReadNodeOutputDefs } from './memory-node-output-defs'
import { MEMORY_READ_NODE_ICON } from './memory-node-icons'

export const MEMORY_READ_NODE_TYPE = 'memoryReadNode'

/** 记忆提取：LRANGE 读取 flow_game:flow_context:{md5(contextKey)} */
export const nodeMemoryRead: CustomNode = {
  title: '记忆提取',
  description:
    '从 Redis 列表读取记忆；键规则与「记忆写入」一致（上下文引用值 MD5）',
  sortNo: 361,
  group: 'base',
  icon: MEMORY_READ_NODE_ICON,
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
