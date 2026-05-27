import type { CustomNode } from '@tinyflow-ai/ui'
import {
  mountHtmlTemplateCanvasPreview,
  updateHtmlTemplateCanvasPreview
} from './html-template-canvas-preview'
import { htmlTemplateNodeDefaultParameters } from './html-template-node-parameters'
import { htmlTemplateNodeOutputDefs } from './html-template-node-output-defs'

export const HTML_TEMPLATE_NODE_TYPE = 'htmlTemplateNode'

const HTML_TEMPLATE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM4 5V19H20V5H4ZM7 8H17V11H15V10H13V14H14.5V16H9.5V14H11V10H9V11H7V8Z"></path></svg>'

/** 与侧栏动态代码「执行代码」多行框一致 */
export const HTML_TEMPLATE_PLACEHOLDER =
  '使用 {{ 参数名称 }} 引用入参，例如 {{ content }}'

export const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>FlowGame</title>
</head>
<body>
  <div>{{ content }}</div>
</body>
</html>`

/**
 * HTML 模板：入参为引用类型，模板内用 {{ 参数名称 }} 占位，输出渲染后的 html 字符串。
 * 执行端复用 TemplateNode（与 templateNode 相同解析逻辑）。
 */
export const nodeHtmlTemplate: CustomNode = {
  title: 'HTML模板',
  description:
    '入参使用「引用」绑定上游变量；在 HTML 模板中用 {{ 参数名称 }} 占位，输出渲染后的 HTML',
  sortNo: 345,
  group: 'base',
  icon: HTML_TEMPLATE_ICON,
  parameters: htmlTemplateNodeDefaultParameters,
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: htmlTemplateNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    { type: 'heading', label: 'HTML 模板' },
    {
      type: 'textarea',
      name: 'template',
      label: '模板内容',
      placeholder: '使用 {{ 参数名称 }} 引用入参，例如 {{ content }}',
      defaultValue: DEFAULT_HTML_TEMPLATE,
      description:
        '占位符写法：双花括号 + 入参「参数名称」，与内置内容模板一致，如 {{ title }}、{{ content }}'
    }
  ],
  render: (parent, node, flow) => {
    requestAnimationFrame(() => {
      mountHtmlTemplateCanvasPreview(parent, node, flow)
    })
  },
  onUpdate: (parent, node) => {
    requestAnimationFrame(() => {
      updateHtmlTemplateCanvasPreview(parent, node)
    })
  }
}
