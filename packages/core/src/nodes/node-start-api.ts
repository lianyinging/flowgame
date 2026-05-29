import type { CustomNode } from '@tinyflow-ai/ui'
import { httpNodeOutputDefs } from './http-node-output-defs'
import { nodeFormHeading } from './node-form-heading'
import { renderMethodKeyDisplay } from './method-key-readonly'

/** API 接口开始节点：供外部 HTTP 调用，可配置回调地址与对外返回参数 */
export const nodeStartApi: CustomNode = {
  title: 'Api接口开始',
  description: '仅可作为流程唯一起点（无上游连线）；与「开始节点」二选一',
  sortNo: 50,
  group: 'base',
  onUpdate: (parent, node) => {
    renderMethodKeyDisplay(parent, node)
  },
  icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  parametersEnable: false,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  outputDefs: httpNodeOutputDefs,
  forms: [
    nodeFormHeading('API 接口配置'),
    {
      type: 'select',
      name: 'requestType',
      label: '请求方式',
      defaultValue: 'post',
      options: [
        { label: 'GET', value: 'get' },
        { label: 'POST', value: 'post' },
        { label: 'PUT', value: 'put' },
        { label: 'DELETE', value: 'delete' },
        { label: 'HEAD', value: 'head' },
        { label: 'PATCH', value: 'patch' }
      ]
    },
    {
      type: 'input',
      name: 'externalUrl',
      label: '外部请求地址',
      placeholder: 'https://your-domain.com/api/flowgame/execute',
      description: '供外部系统调用的完整 URL，保存后可在流程说明或网关中引用'
    },
    {
      type: 'textarea',
      name: 'apiDescription',
      label: '接口说明',
      placeholder: '可选：描述该接口用途、鉴权方式等'
    }
  ]
}
