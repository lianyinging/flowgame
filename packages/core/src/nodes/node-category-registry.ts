/**
 * 节点菜单分类（与 CustomNode 定义解耦，不写入节点本身的 group/title 等字段）。
 * 在 Tinyflow 渲染左侧列表后，由 patch 按 type 归入对应分类标题下。
 */

export interface FlowGameNodeCategory {
  id: string
  label: string
  sortNo?: number
}

/** 分类 Tab 顺序（未出现在映射中的节点归入 `other`） */
export const FLOWGAME_NODE_CATEGORIES: FlowGameNodeCategory[] = [
  { id: 'entry', label: '流程入口', sortNo: 10 },
  { id: 'ai', label: 'AI 能力', sortNo: 20 },
  { id: 'data', label: '数据访问', sortNo: 30 },
  { id: 'parallel', label: '并行控制', sortNo: 40 },
  { id: 'memory', label: '记忆', sortNo: 50 },
  { id: 'general', label: '通用节点', sortNo: 60 },
  { id: 'other', label: '其他', sortNo: 99 }
]

const DEFAULT_OTHER_CATEGORY = 'other'

/** 节点 type → 分类 id（可在接入方通过 registerNodeTypeCategories 扩展） */
const nodeTypeCategoryMap: Record<string, string> = {
  startNode: 'entry',
  node_start_api: 'entry',
  node_start_talk: 'entry',
  endNode: 'entry',
  llmNode: 'ai',
  llmapiNode: 'ai',
  knowledgeNode: 'ai',
  knowledgeNodePlus: 'ai',
  searchEngineNode: 'ai',
  databaseNode: 'data',
  ossNode: 'data',
  forkNode: 'parallel',
  joinAllNode: 'parallel',
  joinAnyNode: 'parallel',
  ifNode: 'parallel',
  switchNode: 'parallel',
  memoryWriteNode: 'memory',
  memoryReadNode: 'memory',
  stateMachineNode: 'memory',
  httpNode: 'general',
  codeNode: 'general',
  templateNode: 'general',
  htmlTemplateNode: 'general',
  loopNode: 'general',
  confirmNode: 'general'
}

export function registerNodeTypeCategories(mapping: Record<string, string>) {
  Object.assign(nodeTypeCategoryMap, mapping)
}

export function registerNodeCategories(categories: FlowGameNodeCategory[]) {
  for (const item of categories) {
    const index = FLOWGAME_NODE_CATEGORIES.findIndex(c => c.id === item.id)
    if (index >= 0)
      FLOWGAME_NODE_CATEGORIES[index] = { ...FLOWGAME_NODE_CATEGORIES[index], ...item }
    else
      FLOWGAME_NODE_CATEGORIES.push(item)
  }
  FLOWGAME_NODE_CATEGORIES.sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0))
}

export function resolveNodeCategory(nodeType: string): string {
  if (!nodeType)
    return DEFAULT_OTHER_CATEGORY
  return nodeTypeCategoryMap[nodeType] ?? DEFAULT_OTHER_CATEGORY
}

export function getSortedNodeCategories(): FlowGameNodeCategory[] {
  return [...FLOWGAME_NODE_CATEGORIES].sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0))
}
