import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

/** 上传正文：HTML 字符串、JSON 文本；图片类型可为 http(s) 链接（后端拉取后上传） */
export const ossContentParameter: Parameter = {
  id: newParameterId('oss_content'),
  name: 'content',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  ref: '',
  required: false,
  description:
    '上传内容（必填）。引用上游 html/output/body 等；或类型选「固定值」直接粘贴 HTML/文本；image 可为图片 URL'
}

/** 可选：覆盖侧栏 Object Key 模板 */
export const ossObjectKeyParameter: Parameter = {
  id: newParameterId('oss_key'),
  name: 'objectKey',
  nameDisabled: true,
  deleteDisabled: false,
  dataType: 'String',
  refType: 'ref',
  ref: '',
  required: false,
  description: '完整对象路径；填写后优先于侧栏 Key 模板；不需要时可删除本行'
}

export const ossNodeDefaultParameters: Parameter[] = [ossContentParameter, ossObjectKeyParameter]
