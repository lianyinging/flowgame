import type { Parameter } from '@tinyflow-ai/ui'

/** 对话开始节点输出：/talk/message 注入的全局变量 */
export const talkMessageParameter: Parameter = {
  name: 'message',
  nameDisabled: true,
  dataType: 'String',
  dataTypeDisabled: true,
  deleteDisabled: true,
  description: '用户在本轮对话页输入的内容（/talk/message 注入）'
}

export const talkSessionIdParameter: Parameter = {
  name: 'sessionId',
  nameDisabled: true,
  dataType: 'String',
  dataTypeDisabled: true,
  deleteDisabled: true,
  description: '可选会话 ID，多轮对话时可配合记忆节点使用'
}

/** 图生图对话模板上传的参考图（data:image/...;base64,...），最多 3 张 */
export const talkImgBase64ListParameter: Parameter = {
  name: 'imgBase64List',
  nameDisabled: true,
  dataType: 'Array<String>',
  dataTypeDisabled: true,
  deleteDisabled: true,
  description:
    '用户上传图片转成的 base64 列表（最多 3）；可引用到图像生成 imageUrl'
}

export const talkNodeOutputDefs: Parameter[] = [
  talkMessageParameter,
  talkSessionIdParameter,
  talkImgBase64ListParameter
]
