import type { CustomNode } from '@tinyflow-ai/ui'
import { defaultIfBranches } from './if-branches'
import { mountIfNodeCanvas, updateIfNodeCanvas } from './if-node-canvas'
import { ifNodeOutputDefs } from './if-node-output-defs'

export const IF_NODE_TYPE = 'ifNode'

const IF_NODE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 12L12 22L2 12L12 2ZM12 6.82843L6.82843 12L12 17.1716L17.1716 12L12 6.82843Z"/></svg>'

export const DEFAULT_IF_CONDITION = 'true'

/** 条件选择器：if / else if / else 多分支，单出口连多条下游后在侧栏指定出边 */
export const nodeIf: CustomNode = {
  title: '条件选择器',
  description: '输入参数绑定上游变量；条件参数用 {{参数名}} 写判断式，并为各分支指定出边',
  sortNo: 325,
  group: 'base',
  icon: IF_NODE_ICON,
  parameters: [],
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: ifNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [],
  render: (parent, node, flow) => {
    mountIfNodeCanvas(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    updateIfNodeCanvas(parent, node)
  }
}

export { defaultIfBranches }
