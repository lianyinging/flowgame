import type { CustomNode } from '@tinyflow-ai/ui'
import { knowledgeNodeDefaultParameters } from '../inspector/knowledge-node-parameters'
import { createKnowledgeNodeDefaultOutputDefs } from '../inspector/knowledge-node-output-defs'
import { mountKnowledgeBasePicker, updateKnowledgeBasePicker } from './knowledge-base-picker'

const KB_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5C13.567 5 12 6.567 12 8.5C12 10.433 13.567 12 15.5 12C17.433 12 19 10.433 19 8.5C19 6.567 17.433 5 15.5 5ZM10 8.5C10 5.46243 12.4624 3 15.5 3C18.5376 3 21 5.46243 21 8.5C21 9.6575 20.6424 10.7315 20.0317 11.6175L22.7071 14.2929L21.2929 15.7071L18.6175 13.0317C17.7315 13.6424 16.6575 14 15.5 14C12.4624 14 10 11.5376 10 8.5ZM3 4H8V6H3V4ZM3 11H8V13H3V11ZM21 18V20H3V18H21Z"></path></svg>'

/** 自定义知识库节点（仅注册 Plus，覆盖内置 knowledgeNode 的 UI 能力） */
export const nodeKnowledgePlus: CustomNode = {
  title: '知识库 Plus',
  description: '通过知识库检索内容（keyword / limit 在输入参数配置）',
  sortNo: 400,
  group: 'base',
  icon: KB_ICON,
  parameters: knowledgeNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: false,
  outputDefs: createKnowledgeNodeDefaultOutputDefs(),
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    { type: 'heading', name: 'knowledge-base-settings', label: '知识库设置' }
  ],
  render: (parent, node, flow) => {
    void mountKnowledgeBasePicker(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    updateKnowledgeBasePicker(parent, node)
  }
}
