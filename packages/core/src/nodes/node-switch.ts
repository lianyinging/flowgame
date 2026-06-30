import type { CustomNode } from '@tinyflow-ai/ui'
import { DEFAULT_SWITCH_PARAM, defaultSwitchCases } from './switch-cases'
import { mountSwitchNodeCanvas, updateSwitchNodeCanvas } from './switch-node-canvas'
import { switchNodeOutputDefs } from './switch-node-output-defs'
import { nodeFormHeading } from './node-form-heading'

export const SWITCH_NODE_TYPE = 'switchNode'

const SWITCH_NODE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4H10V10H4V4ZM4 14H10V20H4V14ZM14 4H20V10H14V4ZM16 14C14.8954 14 14 14.8954 14 16V18C14 19.1046 14.8954 20 16 20H18C19.1046 20 20 19.1046 20 18V16C20 14.8954 19.1046 14 18 14H16ZM16 16H18V18H16V16Z"/></svg>'

/** 分支选择器：按变量取值等于 case 值路由，每行独立连线桩 */
export const nodeSwitch: CustomNode = {
  title: '分支选择器',
  description: '将输入参数与 case 值做相等匹配；从节点连出多条下游后，在侧栏为每个 case 选择对应出边',
  sortNo: 328,
  group: 'base',
  icon: SWITCH_NODE_ICON,
  parameters: [],
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: switchNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('匹配变量'),
    {
      type: 'input',
      name: 'switchKey',
      label: '分支变量名',
      placeholder: `{{${DEFAULT_SWITCH_PARAM}}}`,
      defaultValue: `{{${DEFAULT_SWITCH_PARAM}}}`,
      description: '填写输入参数名或 {{参数名}}，例如 {{msg}}、{{status}}'
    }
  ],
  render: (parent, node, flow) => {
    mountSwitchNodeCanvas(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    updateSwitchNodeCanvas(parent, node)
  }
}

export { defaultSwitchCases, DEFAULT_SWITCH_PARAM }
