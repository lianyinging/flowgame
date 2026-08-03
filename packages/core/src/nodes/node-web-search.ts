import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import { webSearchNodeDefaultParameters } from './web-search-node-parameters'
import { webSearchNodeOutputDefs } from './web-search-node-output-defs'
import {
  mountWebSearchEnginesPicker,
  updateWebSearchEnginesPicker
} from './web-search-engines-picker'

export const WEB_SEARCH_NODE_TYPE = 'webSearchNode'

const WEB_SEARCH_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>'

/**
 * 网页搜索：腾讯新闻（Playwright）。
 * engines 存于 node.data.engines（string[]）。
 */
export const nodeWebSearch: CustomNode = {
  title: '网页搜索',
  description:
    '腾讯新闻检索（Playwright），输出 documents / title / content / url',
  sortNo: 410,
  group: 'base',
  icon: WEB_SEARCH_ICON,
  parameters: webSearchNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: false,
  outputDefs: webSearchNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('搜索引擎设置', 'web-search-settings')
  ],
  render: (parent, node, flow) => {
    void mountWebSearchEnginesPicker(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    updateWebSearchEnginesPicker(parent, node)
  }
}
