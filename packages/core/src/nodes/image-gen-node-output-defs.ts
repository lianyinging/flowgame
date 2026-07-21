import type { Parameter } from '@tinyflow-ai/ui'
import { newParameterId } from '../inspector/node-inspector-config'

export const imageGenNodeOutputDefs: Parameter[] = [
  {
    id: newParameterId('out'),
    name: 'url',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首张图片 URL（response_format=url 时）'
  },
  {
    id: newParameterId('out'),
    name: 'urls',
    dataType: 'Array',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '全部图片 URL 列表'
  },
  {
    id: newParameterId('out'),
    name: 'b64Json',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true,
    description: '首张图 base64（response_format=b64_json 时）'
  },
  {
    id: newParameterId('out'),
    name: 'success',
    dataType: 'Boolean',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    id: newParameterId('out'),
    name: 'rawResponse',
    dataType: 'Object',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  },
  {
    id: newParameterId('out'),
    name: 'errorMessage',
    dataType: 'String',
    nameDisabled: true,
    dataTypeDisabled: true,
    deleteDisabled: true
  }
]
