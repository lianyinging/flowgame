import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import { llmApiNodeDefaultParameters } from './llmapi-node-parameters'
import { llmApiNodeOutputDefs } from './llmapi-node-output-defs'

export const LLMAPI_NODE_TYPE = 'llmapiNode'

const LLM_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.7134 7.12811L20.4668 7.69379C20.2864 8.10792 19.7136 8.10792 19.5331 7.69379L19.2866 7.12811C18.8471 6.11947 18.0555 5.31641 17.0677 4.87708L16.308 4.53922C15.8973 4.35653 15.8973 3.75881 16.308 3.57612L17.0252 3.25714C18.0384 2.80651 18.8442 1.97373 19.2761 0.930828L19.5293 0.319534C19.7058 -0.106511 20.2942 -0.106511 20.4706 0.319534L20.7238 0.930828C21.1558 1.97373 21.9616 2.80651 22.9748 3.25714L23.6919 3.57612C24.1027 3.75881 24.1027 4.35653 23.6919 4.53922L22.9323 4.87708C21.9445 5.31641 21.1529 6.11947 20.7134 7.12811ZM9 2C13.0675 2 16.426 5.03562 16.9337 8.96494L19.1842 12.5037C19.3324 12.7367 19.3025 13.0847 18.9593 13.2317L17 14.071V17C17 18.1046 16.1046 19 15 19H13.001L13 22H4L4.00025 18.3061C4.00033 17.1252 3.56351 16.0087 2.7555 15.0011C1.65707 13.6313 1 11.8924 1 10C1 5.58172 4.58172 2 9 2ZM9 4C5.68629 4 3 6.68629 3 10C3 11.3849 3.46818 12.6929 4.31578 13.7499C5.40965 15.114 6.00036 16.6672 6.00025 18.3063L6.00013 20H11.0007L11.0017 17H15V12.7519L16.5497 12.0881L15.0072 9.66262L14.9501 9.22118C14.5665 6.25141 12.0243 4 9 4ZM19.4893 16.9929L21.1535 18.1024C22.32 16.3562 23 14.2576 23 12.0001C23 11.317 22.9378 10.6486 22.8186 10L20.8756 10.5C20.9574 10.9878 21 11.489 21 12.0001C21 13.8471 20.4436 15.5642 19.4893 16.9929Z"></path></svg>'

/**
 * 模型调用：通过 HTTP 调用 OpenAI 兼容 Chat Completions 等接口获取结果。
 * 配置保存在节点 data，由 flowgame 执行引擎读取（需后端实现对应执行器）。
 */
export const nodeLlmApi: CustomNode = {
  title: '模型调用',
  description: '调用外部模型 HTTP 接口（OpenAI 兼容），支持 API Key、提示词与采样参数',
  sortNo: 350,
  group: 'base',
  icon: LLM_ICON,
  parameters: llmApiNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: llmApiNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('模型接口'),
    {
      type: 'input',
      name: 'modelApiUrl',
      label: '模型接口地址',
      placeholder: 'https://api.deepseek.com/v1/chat/completions',
      defaultValue: 'https://api.deepseek.com/v1/chat/completions',
      description: '需为 Chat Completions 完整路径；仅填域名时后端会自动补全 /v1/chat/completions'
    },
    {
      type: 'input',
      name: 'apiKey',
      label: 'API Key',
      placeholder: 'sk-...',
      defaultValue: '',
      description: '鉴权密钥，将保存在流程 JSON 中，请注意权限与脱敏',
      attrs: { type: 'password', autocomplete: 'off' }
    },
    {
      type: 'input',
      name: 'modelName',
      label: '模型名称',
      placeholder: 'gpt-4o-mini',
      defaultValue: 'gpt-4o-mini'
    },
    {
      type: 'select',
      name: 'authType',
      label: '鉴权方式',
      defaultValue: 'bearer',
      options: [
        { label: 'Bearer Token', value: 'bearer' },
        { label: '自定义 Header', value: 'header' }
      ]
    },
    {
      type: 'input',
      name: 'authHeaderName',
      label: '自定义 Header 名',
      placeholder: 'X-API-Key',
      defaultValue: 'Authorization',
      description: '鉴权方式为「自定义 Header」时生效'
    },
    {
      type: 'input',
      name: 'requestTimeoutMs',
      label: '超时时间（毫秒）',
      placeholder: '60000',
      defaultValue: '60000'
    },
    nodeFormHeading('提示词与采样'),
    {
      type: 'textarea',
      name: 'systemPrompt',
      label: '系统提示词',
      placeholder: '你是专业助手…',
      defaultValue: ''
    },
    {
      type: 'textarea',
      name: 'userPrompt',
      label: '用户提示词',
      placeholder: '请根据以下内容回答：{{userMessage}}',
      defaultValue: '{{userMessage}}',
      description: '可与输入参数 userMessage 配合；支持 {{参数名}} 占位'
    },
    {
      type: 'slider',
      name: 'temperature',
      label: 'Temperature',
      defaultValue: 0.7,
      description: '采样温度',
      attrs: { min: 0, max: 2, step: 0.1 }
    },
    {
      type: 'input',
      name: 'maxTokens',
      label: '最大 Token',
      placeholder: '2048',
      defaultValue: '2048'
    },
    {
      type: 'select',
      name: 'responseFormat',
      label: '响应格式',
      defaultValue: 'text',
      options: [
        { label: '文本', value: 'text' },
        { label: 'JSON Object', value: 'json_object' }
      ]
    },
    nodeFormHeading('高级'),
    {
      type: 'textarea',
      name: 'extraHeaders',
      label: '额外请求头（JSON）',
      placeholder: '{"X-Custom":"value"}',
      defaultValue: '',
      description: '可选，JSON 对象字符串，合并到 HTTP 请求头'
    },
    {
      type: 'textarea',
      name: 'extraBody',
      label: '额外请求体（JSON）',
      placeholder: '{"stream":false}',
      defaultValue: '',
      description: '可选，合并到请求 body 的 JSON 字段'
    }
  ]
}
