import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import { imageGenNodeDefaultParameters } from './image-gen-node-parameters'
import { imageGenNodeOutputDefs } from './image-gen-node-output-defs'

export const IMAGE_GEN_NODE_TYPE = 'imageGenNode'

/** OpenAI 兼容（Seedream / DALL·E） */
export const DEFAULT_IMAGE_GEN_PROVIDER = 'openai'
export const DEFAULT_IMAGE_GEN_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3'
export const DEFAULT_IMAGE_GEN_MODEL = 'doubao-seedream-5-0-260128'
export const DEFAULT_IMAGE_GEN_SIZE = '2K'

/** 阿里云百炼 DashScope 原生（qwen-image 不支持 OpenAI compatible） */
export const DASHSCOPE_IMAGE_GEN_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'
export const DASHSCOPE_IMAGE_GEN_MODEL = 'qwen-image-2.0-pro'
export const DASHSCOPE_IMAGE_GEN_SIZE = '2048*2048'

export const DEFAULT_IMAGE_GEN_PROMPT_TEMPLATE = '{{prompt}}'
export const DEFAULT_IMAGE_GEN_TIMEOUT_MS = '120000'
export const DEFAULT_IMAGE_GEN_EXTRA_BODY = '{\n  "watermark": true\n}'
export const DASHSCOPE_IMAGE_GEN_EXTRA_BODY =
  '{\n  "prompt_extend": true,\n  "watermark": false\n}'

const IMAGE_GEN_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11.1005L7 9.1005L12.5 14.6005L16 11.1005L19 14.1005V5H5V11.1005ZM5 13.9289V19H8.1005L11.0858 16.0147L7 11.9289L5 13.9289ZM19 16.0858L16 13.0858L11.9142 17.1716L14.1 19H19V16.0858ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3Z"/></svg>'

/**
 * 图像生成 / 图生图编辑：
 * - openai：OpenAI SDK images.generate（Seedream / DALL·E，仅文生图）
 * - dashscope：百炼原生 multimodal-generation；无参考图=文生图，有 imageUrl=图生图/编辑（单张或数组最多 3 张）
 */
export const nodeImageGen: CustomNode = {
  title: '图像生成',
  description:
    '文生图 / 图生图编辑。DashScope 下 imageUrl 支持单张或多张数组（最多 3）；OpenAI 兼容仅文生图',
  sortNo: 360,
  group: 'base',
  icon: IMAGE_GEN_ICON,
  parameters: imageGenNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: imageGenNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('模型接口', 'image-gen-api'),
    {
      type: 'select',
      name: 'provider',
      label: '接口协议',
      defaultValue: DEFAULT_IMAGE_GEN_PROVIDER,
      options: [
        { label: 'OpenAI 兼容（SDK images.generate）', value: 'openai' },
        { label: 'DashScope 原生（Qwen 文生图/编辑）', value: 'dashscope' }
      ],
      description:
        '图生图/编辑请选 DashScope；imageUrl 可为单张或数组（最多 3 张 base64/URL）'
    },
    {
      type: 'input',
      name: 'baseUrl',
      label: 'Base URL',
      placeholder: DEFAULT_IMAGE_GEN_BASE_URL,
      defaultValue: DEFAULT_IMAGE_GEN_BASE_URL,
      description:
        'OpenAI：如 https://ark.cn-beijing.volces.com/api/v3；DashScope：https://dashscope.aliyuncs.com/api/v1'
    },
    {
      type: 'input',
      name: 'apiKey',
      label: 'API Key',
      placeholder: 'sk-... / 方舟 / 百炼 Key',
      defaultValue: '',
      description: '将保存在流程 JSON 中，请注意权限与脱敏',
      attrs: { type: 'password', autocomplete: 'off' }
    },
    {
      type: 'input',
      name: 'model',
      label: '模型',
      placeholder: DEFAULT_IMAGE_GEN_MODEL,
      defaultValue: DEFAULT_IMAGE_GEN_MODEL,
      description:
        '文生图：qwen-image-2.0-pro；编辑也可用 qwen-image-edit-plus 等（见百炼文档）'
    },
    {
      type: 'input',
      name: 'size',
      label: '尺寸 size',
      placeholder: DEFAULT_IMAGE_GEN_SIZE,
      defaultValue: DEFAULT_IMAGE_GEN_SIZE,
      description:
        'OpenAI/Seedream：1K/2K/4K；DashScope：宽*高，如 2048*2048'
    },
    {
      type: 'input',
      name: 'requestTimeoutMs',
      label: '超时时间（毫秒）',
      placeholder: DEFAULT_IMAGE_GEN_TIMEOUT_MS,
      defaultValue: DEFAULT_IMAGE_GEN_TIMEOUT_MS
    },
    nodeFormHeading('提示词', 'image-gen-prompt'),
    {
      type: 'textarea',
      name: 'promptTemplate',
      label: '提示词模板',
      placeholder: DEFAULT_IMAGE_GEN_PROMPT_TEMPLATE,
      defaultValue: DEFAULT_IMAGE_GEN_PROMPT_TEMPLATE,
      description: '支持 {{prompt}}；有参考图时即编辑指令'
    },
    {
      type: 'select',
      name: 'responseFormat',
      label: '响应格式（仅 OpenAI）',
      defaultValue: 'url',
      options: [
        { label: 'URL', value: 'url' },
        { label: 'Base64 JSON', value: 'b64_json' }
      ],
      description: 'DashScope 固定返回图片 URL，此项忽略'
    },
    nodeFormHeading('高级', 'image-gen-advanced'),
    {
      type: 'textarea',
      name: 'extraBody',
      label: '额外参数（JSON）',
      placeholder: DEFAULT_IMAGE_GEN_EXTRA_BODY,
      defaultValue: DEFAULT_IMAGE_GEN_EXTRA_BODY,
      description:
        'OpenAI → extra_body；DashScope → parameters（prompt_extend、n、negative_prompt、watermark）'
    }
  ]
}
