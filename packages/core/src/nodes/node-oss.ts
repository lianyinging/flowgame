import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import {
  DEFAULT_OSS_FILE_TYPE,
  OSS_FILE_TYPES
} from './oss-file-types'
import { ossNodeDefaultParameters } from './oss-node-parameters'
import { ossNodeOutputDefs } from './oss-node-output-defs'

export const OSS_NODE_TYPE = 'ossNode'

export const DEFAULT_OSS_OBJECT_KEY_TEMPLATE = 'uploads/{{methodKey}}/{{timestamp}}'

const OSS_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.68629 2 6 4.68629 6 8V9H4C2.89543 9 2 9.89543 2 11V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V11C22 9.89543 21.1046 9 20 9H18V8C18 4.68629 15.3137 2 12 2ZM12 4C14.2091 4 16 5.79086 16 8V9H8V8C8 5.79086 9.79086 4 12 4ZM4 11H20V19H4V11ZM12 13C10.8954 13 10 13.8954 10 15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15C14 13.8954 13.1046 13 12 13Z"/></svg>'

/**
 * 对象存储上传：入参 content + 侧栏 fileType（image/html/txt/json 等）。
 * 凭证与 Bucket 由 flowgame_python .env 配置（OSS_*）。
 */
export const nodeOss: CustomNode = {
  title: '对象存储',
  description:
    '将 content 上传到 OSS。image 类型支持图片 URL 自动下载；html/txt/json 为文本上传',
  sortNo: 356,
  group: 'base',
  icon: OSS_ICON,
  parameters: ossNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: ossNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('上传配置'),
    {
      type: 'select',
      name: 'fileType',
      label: '文件类型',
      defaultValue: DEFAULT_OSS_FILE_TYPE,
      options: OSS_FILE_TYPES.map(t => ({ label: t.label, value: t.value })),
      description: '决定 Content-Type 与默认扩展名；image 时 content 可为图片链接'
    },
    {
      type: 'input',
      name: 'objectKeyTemplate',
      label: 'Object Key 模板',
      placeholder: DEFAULT_OSS_OBJECT_KEY_TEMPLATE,
      defaultValue: DEFAULT_OSS_OBJECT_KEY_TEMPLATE,
      description: '支持 {{timestamp}}、{{methodKey}} 及自定义入参名（如 {{userId}}）；无扩展名时按类型自动补全'
    },
    {
      type: 'input',
      name: 'bucket',
      label: 'Bucket（可选）',
      placeholder: '留空使用环境变量 OSS_BUCKET',
      defaultValue: '',
      description: '覆盖默认 Bucket，一般无需填写'
    }
  ]
}
