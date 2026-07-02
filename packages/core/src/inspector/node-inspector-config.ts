import type { CustomNode, CustomNodeForm, Parameter } from '@tinyflow-ai/ui'
import { flowGameCustomNodes } from '../nodes'
import { isKnowledgeNodeType } from './knowledge-node-inspector'
import { BUILTIN_NODE_ICONS } from './node-type-icons'

export interface InspectorFlowNode {
  id: string
  type?: string
  selected?: boolean
  data?: Record<string, unknown>
}

export const NODE_TYPE_LABELS: Record<string, string> = {
  startNode: '开始节点',
  endNode: '结束节点',
  node_start_api: 'Api接口开始',
  node_start_talk: '对话开始',
  llmapiNode: '模型调用',
  llmNode: '大模型',
  httpNode: 'Http 请求',
  knowledgeNodePlus: '知识库 Plus',
  memoryWriteNode: '记忆写入',
  memoryReadNode: '记忆提取',
  stateMachineNode: '状态机',
  htmlTemplateNode: 'HTML模板',
  databaseNode: '数据库',
  ossNode: '对象存储',
  forkNode: '并行分叉',
  joinAllNode: '汇聚（全部）',
  joinAnyNode: '汇聚（任一）',
  ifNode: '条件选择器',
  switchNode: '分支选择器',
  codeNode: '动态代码',
  templateNode: '内容模板',
  loopNode: '循环',
  searchEngineNode: '搜索引擎',
  confirmNode: '用户确认'
}

const RESERVED_DATA_KEYS = new Set([
  'title',
  'description',
  'expand',
  'parameters',
  'outputDefs',
  'images',
  'methodKey',
  'talkTemplate',
  'talkTitle',
  'welcomeMessage',
  'engine',
  'code',
  'template',
  'sqlTemplate',
  'dbType',
  'fileType',
  'objectKeyTemplate',
  'bucket',
  'mode',
  'namespace',
  'keyTemplate',
  'expireSeconds',
  'refreshTtl',
  'defaultStatus',
  'failIfMissing',
  'returnLastState'
])

/** 画布用自定义参数 UI、侧栏仍展示「输入参数」的节点 */
const INSPECTOR_INPUT_ALWAYS_TYPES = new Set(['memoryWriteNode', 'stateMachineNode'])

export function getNodeTypeLabel(type?: string) {
  if (!type)
    return '未知节点'
  return NODE_TYPE_LABELS[type] ?? type
}

/** 节点图标 SVG（自定义节点优先，否则与 Tinyflow 内置工具栏一致） */
export function getNodeIconHtml(type?: string): string | undefined {
  if (!type)
    return undefined
  const customIcon = getCustomNodeDef(type)?.icon
  if (customIcon)
    return customIcon
  return BUILTIN_NODE_ICONS[type]
}

export function getCustomNodeDef(type?: string): CustomNode | undefined {
  if (!type)
    return undefined
  return flowGameCustomNodes[type]
}

/** 与节点内展开区一致，保留 heading 分组标题 */
export function getInspectorForms(type?: string): CustomNodeForm[] {
  if (isKnowledgeNodeType(type))
    return []
  const def = getCustomNodeDef(type)
  return def?.forms ?? []
}

export function getInspectorFormFields(type?: string): CustomNodeForm[] {
  return getInspectorForms(type).filter(f => f.type !== 'heading')
}

export function isInspectorParametersEnabled(type?: string): boolean {
  if (type && INSPECTOR_INPUT_ALWAYS_TYPES.has(type))
    return true
  const def = getCustomNodeDef(type)
  if (!def)
    return true
  return def.parametersEnable !== false
}

export function isInspectorOutputDefsEnabled(type?: string): boolean {
  const def = getCustomNodeDef(type)
  if (!def)
    return true
  return def.outputDefsEnable !== false
}

export function getExtraDataFields(data: Record<string, unknown>): string[] {
  return Object.keys(data).filter(key => !RESERVED_DATA_KEYS.has(key))
}

export type FlowParameter = Parameter & { id?: string }

export function cloneParameters(params?: FlowParameter[]): FlowParameter[] {
  if (!Array.isArray(params))
    return []
  return JSON.parse(JSON.stringify(params)) as FlowParameter[]
}

export const PARAMETER_DATA_TYPES = [
  { label: 'String', value: 'String' },
  { label: 'Number', value: 'Number' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'Object', value: 'Object' },
  { label: 'Array', value: 'Array' },
  { label: 'File', value: 'File' }
] as const

export const REF_TYPE_OPTIONS = [
  { label: '引用', value: 'ref' },
  { label: '固定值', value: 'fixed' },
  { label: '输入', value: 'input' }
] as const

export function newParameterId(prefix = 'param') {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`
}
