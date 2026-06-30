import type { TinyflowOptions } from '@tinyflow-ai/ui'
import { nodeOss } from './node-oss'
import { nodeDatabase } from './node-database'
import { nodeFork } from './node-fork'
import { nodeJoinAll } from './node-join-all'
import { nodeJoinAny } from './node-join-any'
import { nodeIf } from './node-if'
import { nodeSwitch } from './node-switch'
import { nodeHtmlTemplate } from './node-html-template'
import { nodeKnowledgePlus } from './node-knowledge'
import { nodeLlmApi } from './node-llmapi'
import { nodeMemoryRead } from './node-memory-read'
import { nodeMemoryWrite } from './node-memory-write'
import { nodeStartApi } from './node-start-api'
import { nodeStartTalk } from './node-start-talk'

/** 流程编排自定义节点注册表，key 与节点 type 一致 */
export const flowGameCustomNodes: NonNullable<TinyflowOptions['customNodes']> = {
  node_start_api: nodeStartApi,
  node_start_talk: nodeStartTalk,
  llmapiNode: nodeLlmApi,
  knowledgeNodePlus: nodeKnowledgePlus,
  memoryWriteNode: nodeMemoryWrite,
  memoryReadNode: nodeMemoryRead,
  htmlTemplateNode: nodeHtmlTemplate,
  databaseNode: nodeDatabase,
  ossNode: nodeOss,
  forkNode: nodeFork,
  joinAllNode: nodeJoinAll,
  joinAnyNode: nodeJoinAny,
  ifNode: nodeIf,
  switchNode: nodeSwitch
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
export { nodeOss, OSS_NODE_TYPE, DEFAULT_OSS_OBJECT_KEY_TEMPLATE } from './node-oss'
export { OSS_FILE_TYPES, DEFAULT_OSS_FILE_TYPE, getOssFileTypeMeta } from './oss-file-types'
export type { OssFileType } from './oss-file-types'
export { ossNodeDefaultParameters, ossContentParameter, ossObjectKeyParameter } from './oss-node-parameters'
export { ossNodeOutputDefs } from './oss-node-output-defs'
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
export { nodeIf, IF_NODE_TYPE, DEFAULT_IF_CONDITION } from './node-if'
export { ifNodeOutputDefs } from './if-node-output-defs'
export {
  appendElseIfBranch,
  createIfBranchId,
  defaultIfBranches,
  ifBranchSelectLabel,
  ifBranchTypeLabel,
  parseIfBranches,
  removeElseIfBranch,
  upgradeLegacyIfBranches,
  IF_ELSE_BRANCH_ID,
  type IfBranchDef,
  type IfBranchType
} from './if-branches'
export { nodeSwitch, SWITCH_NODE_TYPE, DEFAULT_SWITCH_PARAM } from './node-switch'
export { switchNodeOutputDefs } from './switch-node-output-defs'
export {
  appendSwitchCase,
  createSwitchCaseId,
  defaultSwitchCases,
  parseSwitchCases,
  parseSwitchParamRef,
  readSwitchParamName,
  removeSwitchCase,
  switchCaseSelectLabel,
  SWITCH_ELSE_CASE_ID,
  type SwitchCaseDef
} from './switch-cases'
export {
  FLOWGAME_NODE_CATEGORIES,
  getSortedNodeCategories,
  registerNodeCategories,
  registerNodeTypeCategories,
  resolveNodeCategory
} from './node-category-registry'
export type { FlowGameNodeCategory } from './node-category-registry'
export { nodeStartTalk, START_TALK_NODE_TYPE } from './node-start-talk'
