import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import { renderMethodKeyDisplay } from './method-key-readonly'
import { talkNodeOutputDefs } from './talk-node-output-defs'

export const START_TALK_NODE_TYPE = 'node_start_talk'

/** 对话开始节点：供 GET /talk 打开对话页，结束节点需输出 assistantMessage */
export const nodeStartTalk: CustomNode = {
  title: '对话开始',
  description: '仅可作为流程起点（无上游连线）；可与「开始节点」「Api接口开始」并存',
  sortNo: 51,
  group: 'base',
  onUpdate: (parent, node) => {
    renderMethodKeyDisplay(parent, node)
  },
  icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H6L2 22V6C2 4.89543 2.89543 4 4 4ZM7 9H17V11H7V9ZM7 13H14V15H7V13Z"/></svg>',
  parametersEnable: false,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  outputDefs: talkNodeOutputDefs,
  forms: [
    nodeFormHeading('对话页配置'),
    {
      type: 'select',
      name: 'talkTemplate',
      label: '对话界面模板',
      defaultValue: 'default',
      options: [
        { label: '默认（default）', value: 'default' },
        { label: '极简（minimal）', value: 'minimal' }
      ],
      description: '留空或未识别时按 default 渲染'
    },
    {
      type: 'input',
      name: 'talkTitle',
      label: '页面标题',
      placeholder: '例如：智能客服',
      defaultValue: '智能客服'
    },
    {
      type: 'textarea',
      name: 'welcomeMessage',
      label: '欢迎语',
      placeholder: '可选：首屏展示的欢迎文案，支持简单 HTML'
    }
  ]
}
