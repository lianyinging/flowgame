import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import { fetchUrlNodeDefaultParameters } from './fetch-url-node-parameters'
import { fetchUrlNodeOutputDefs } from './fetch-url-node-output-defs'

export const FETCH_URL_NODE_TYPE = 'fetchUrlNode'

export const DEFAULT_FETCH_URL_MAX_CHARS = '6000'

const FETCH_URL_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3638 15.5357L16.9496 14.1215L18.3638 12.7073C20.3164 10.7547 20.3164 7.58884 18.3638 5.63623C16.4112 3.68362 13.2453 3.68362 11.2927 5.63623L9.87849 7.05044L8.46428 5.63623L9.87849 4.22202C12.6122 1.48831 17.0443 1.48831 19.778 4.22202C22.5117 6.95573 22.5117 11.3878 19.778 14.1215L18.3638 15.5357ZM15.5355 18.364L14.1213 19.7782C11.3876 22.5119 6.95548 22.5119 4.22177 19.7782C1.48806 17.0445 1.48806 12.6123 4.22177 9.87862L5.63598 8.46441L7.0502 9.87862L5.63598 11.2928C3.68337 13.2454 3.68337 16.4113 5.63598 18.3639C7.58859 20.3165 10.7544 20.3165 12.707 18.3639L14.1213 16.9497L15.5355 18.364ZM14.8284 7.7573L16.2426 9.17152L9.17155 16.2426L7.75734 14.8284L14.8284 7.7573Z"></path></svg>'

/**
 * URL 抓取：对齐 demo FetcherAgent —— 优先 Jina Reader，失败再 HTML strip。
 */
export const nodeFetchUrl: CustomNode = {
  title: '网页抓取',
  description: '优先 Jina 抽取可读正文，失败则降级 HTML 纯文本（title / content）',
  sortNo: 420,
  group: 'base',
  icon: FETCH_URL_ICON,
  parameters: fetchUrlNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: false,
  outputDefs: fetchUrlNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('抓取设置', 'fetch-url-settings'),
    {
      type: 'input',
      name: 'maxChars',
      label: '正文最大字符数',
      defaultValue: DEFAULT_FETCH_URL_MAX_CHARS,
      placeholder: DEFAULT_FETCH_URL_MAX_CHARS,
      description: '超过部分截断，默认 6000（与资讯 demo 一致）'
    }
  ]
}
