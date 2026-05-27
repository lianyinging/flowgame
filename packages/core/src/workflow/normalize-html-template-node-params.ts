import type { Parameter, TinyflowData } from '@tinyflow-ai/ui'
import { DEFAULT_HTML_TEMPLATE, HTML_TEMPLATE_NODE_TYPE } from '../nodes/node-html-template'
import { htmlTemplateNodeDefaultParameters } from '../nodes/html-template-node-parameters'
import { htmlTemplateNodeOutputDefs } from '../nodes/html-template-node-output-defs'

function cloneParam(param: Parameter): Parameter {
  return JSON.parse(JSON.stringify(param)) as Parameter
}

function ensureParameters(data: Record<string, unknown>): boolean {
  const raw = data.parameters
  if (Array.isArray(raw) && raw.length > 0)
    return false
  data.parameters = htmlTemplateNodeDefaultParameters.map(cloneParam)
  return true
}

function ensureOutputDefs(data: Record<string, unknown>): boolean {
  const raw = data.outputDefs
  if (Array.isArray(raw) && raw.length > 0)
    return false
  data.outputDefs = htmlTemplateNodeOutputDefs.map(cloneParam)
  return true
}

function ensureTemplate(data: Record<string, unknown>): boolean {
  const tpl = data.template
  if (typeof tpl === 'string' && tpl.trim())
    return false
  data.template = DEFAULT_HTML_TEMPLATE
  return true
}

/** 默认 content 入参与记忆提取节点一致：名称固定、不可删 */
function normalizeDefaultContentParameter(data: Record<string, unknown>): boolean {
  const raw = data.parameters
  if (!Array.isArray(raw) || !raw.length)
    return false
  let changed = false
  const next = (raw as Parameter[]).map((p) => {
    if ((p.name || '').trim() !== 'content')
      return p
    let param = p
    if (p.nameDisabled !== true) {
      param = { ...param, nameDisabled: true }
      changed = true
    }
    if (p.deleteDisabled !== true) {
      param = { ...param, deleteDisabled: true }
      changed = true
    }
    return param
  })
  if (changed)
    data.parameters = next
  return changed
}

/** 补齐 HTML 模板节点默认 parameters / outputDefs / template */
export function normalizeHtmlTemplateNodeParams(workflow: TinyflowData): TinyflowData {
  const nodes = workflow.nodes
  if (!nodes?.length)
    return workflow

  let changed = false
  const nextNodes = nodes.map((node) => {
    if (node.type !== HTML_TEMPLATE_NODE_TYPE)
      return node

    const data = { ...(node.data ?? {}) } as Record<string, unknown>
    let nodeChanged = false
    if (ensureParameters(data))
      nodeChanged = true
    if (ensureOutputDefs(data))
      nodeChanged = true
    if (ensureTemplate(data))
      nodeChanged = true
    if (normalizeDefaultContentParameter(data))
      nodeChanged = true
    if (!nodeChanged)
      return node
    changed = true
    return { ...node, data }
  })

  if (!changed)
    return workflow
  return { ...workflow, nodes: nextNodes }
}
