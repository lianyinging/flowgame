import type { Parameter } from '@tinyflow-ai/ui'

/** 对话开始节点输出：/talk/message 注入的全局变量，执行时写入 {nodeId}.message / sessionId */
export const talkNodeOutputDefs: Parameter[] = [
  {
    name: 'message',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '用户在本轮对话页输入的内容（/talk/message 注入）'
  },
  {
    name: 'sessionId',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '可选会话 ID，多轮对话时可配合记忆节点使用'
  }
]
