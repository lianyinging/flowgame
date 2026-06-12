import type { TinyflowOptions } from '@tinyflow-ai/ui'
import { nodeDatabase } from './node-database'
import { nodeFork } from './node-fork'
import { nodeJoinAll } from './node-join-all'
import { nodeJoinAny } from './node-join-any'
import { nodeHtmlTemplate } from './node-html-template'
import { nodeKnowledgePlus } from './node-knowledge'
import { nodeLlmApi } from './node-llmapi'
import { nodeMemoryRead } from './node-memory-read'
import { nodeMemoryWrite } from './node-memory-write'
import { nodeStartApi } from './node-start-api'

/** 流程编排自定义节点注册表，key 与节点 type 一致 */
export const flowGameCustomNodes: NonNullable<TinyflowOptions['customNodes']> = {
  node_start_api: nodeStartApi,
  llmapiNode: nodeLlmApi,
  knowledgeNodePlus: nodeKnowledgePlus,
  memoryWriteNode: nodeMemoryWrite,
  memoryReadNode: nodeMemoryRead,
  htmlTemplateNode: nodeHtmlTemplate,
  databaseNode: nodeDatabase,
  forkNode: nodeFork,
  joinAllNode: nodeJoinAll,
  joinAnyNode: nodeJoinAny
}

export { nodeHtmlTemplate, HTML_TEMPLATE_NODE_TYPE, DEFAULT_HTML_TEMPLATE, HTML_TEMPLATE_PLACEHOLDER } from './node-html-template'
export { nodeMemoryWrite, MEMORY_WRITE_NODE_TYPE } from './node-memory-write'
export { nodeMemoryRead, MEMORY_READ_NODE_TYPE } from './node-memory-read'
export {
  memoryReadNodeDefaultParameters,
  memoryReadLimitParameter,
  memoryContextKeyParameter,
  memoryWriteNodeDefaultParameters
} from './memory-node-parameters'
export { memoryReadNodeOutputDefs, memoryWriteNodeOutputDefs } from './memory-node-output-defs'
export { htmlTemplateNodeDefaultParameters } from './html-template-node-parameters'
export { htmlTemplateNodeOutputDefs } from './html-template-node-output-defs'
export { nodeDatabase, DATABASE_NODE_TYPE, DEFAULT_DATABASE_SQL } from './node-database'
export { databaseNodeOutputDefs } from './database-node-output-defs'
export { nodeFork, FORK_NODE_TYPE } from './node-fork'
export { nodeJoinAll, JOIN_ALL_NODE_TYPE } from './node-join-all'
export { nodeJoinAny, JOIN_ANY_NODE_TYPE } from './node-join-any'
export {
  forkNodeOutputDefs,
  joinAllNodeOutputDefs,
  joinAnyNodeOutputDefs
} from './join-node-output-defs'
export {
  FLOWGAME_NODE_CATEGORIES,
  getSortedNodeCategories,
  registerNodeCategories,
  registerNodeTypeCategories,
  resolveNodeCategory
} from './node-category-registry'
export type { FlowGameNodeCategory } from './node-category-registry'
