import type { Parameter } from '@tinyflow-ai/ui'

export const ossNodeOutputDefs: Parameter[] = [
  {
    name: 'success',
    nameDisabled: true,
    dataType: 'Boolean',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'url',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '访问地址（公网直链或签名 URL）'
  },
  {
    name: 'objectKey',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: 'OSS 对象路径'
  },
  {
    name: 'fileType',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '本次上传的文件类型'
  },
  {
    name: 'contentType',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'etag',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    name: 'errorMessage',
    nameDisabled: true,
    dataType: 'String',
    dataTypeDisabled: true,
    deleteDisabled: true
  }
]
