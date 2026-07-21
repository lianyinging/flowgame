import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/** 生图/编辑提示词（文生图描述，或图生图编辑指令） */
export const imageGenPromptParameter: Parameter = {
  id: newParameterId('image_gen_prompt'),
  name: 'prompt',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '文生图描述，或图生图/编辑指令；可引用上游'
}

/**
 * 参考图（图生图/编辑）：公网 URL 或 data:image/...;base64,...
 * 兼容单张字符串，或多张数组（最多 3 张）；也可再加 imageUrl2 / imageUrl3
 */
export const imageGenImageUrlParameter: Parameter = {
  id: newParameterId('image_gen_image_url'),
  name: 'imageUrl',
  nameDisabled: true,
  deleteDisabled: false,
  dataType: 'Array<String>',
  refType: 'ref',
  defaultValue: '',
  description:
    '参考图：单张字符串或多张数组（最多 3）。URL / data:image/...;base64,...；留空=文生图'
}

export const imageGenImageUrl2Parameter: Parameter = {
  id: newParameterId('image_gen_image_url2'),
  name: 'imageUrl2',
  nameDisabled: true,
  deleteDisabled: false,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '第 2 张参考图（可选，最多 3 张）'
}

export const imageGenImageUrl3Parameter: Parameter = {
  id: newParameterId('image_gen_image_url3'),
  name: 'imageUrl3',
  nameDisabled: true,
  deleteDisabled: false,
  dataType: 'String',
  refType: 'ref',
  defaultValue: '',
  description: '第 3 张参考图（可选，最多 3 张）'
}

/** 默认只带 prompt + imageUrl；2/3 可按需添加或由 normalize 补齐 */
export const imageGenNodeDefaultParameters: Parameter[] = [
  imageGenPromptParameter,
  imageGenImageUrlParameter
]
