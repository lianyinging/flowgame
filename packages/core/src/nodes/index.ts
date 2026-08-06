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
import { nodeStateMachine } from './node-state-machine'
import { nodeMemoryRead } from './node-memory-read'
import { nodeMemoryWrite } from './node-memory-write'
import { nodeStartApi } from './node-start-api'
import { nodeStartTalk } from './node-start-talk'
import { nodeWebSearch } from './node-web-search'
import { nodeFetchUrl } from './node-fetch-url'
import { nodeImageGen } from './node-image-gen'
import { nodeEndApi } from './node-end-api'
import { nodeCode } from './node-code'

/** 流程编排自定义节点注册表，key 与节点 type 一致 */
export const flowGameCustomNodes: NonNullable<TinyflowOptions['customNodes']> = {
  node_start_api: nodeStartApi,
  node_start_talk: nodeStartTalk,
  node_end_api: nodeEndApi,
  llmapiNode: nodeLlmApi,
  knowledgeNodePlus: nodeKnowledgePlus,
  webSearchNode: nodeWebSearch,
  fetchUrlNode: nodeFetchUrl,
  imageGenNode: nodeImageGen,
  memoryWriteNode: nodeMemoryWrite,
  memoryReadNode: nodeMemoryRead,
  stateMachineNode: nodeStateMachine,
  htmlTemplateNode: nodeHtmlTemplate,
  databaseNode: nodeDatabase,
  ossNode: nodeOss,
  forkNode: nodeFork,
  joinAllNode: nodeJoinAll,
  joinAnyNode: nodeJoinAny,
  ifNode: nodeIf,
  switchNode: nodeSwitch,
  // 覆盖 Tinyflow 内置动态代码（去掉 Groovy/QLExpress，默认 js）
  codeNode: nodeCode
}

export { nodeHtmlTemplate, HTML_TEMPLATE_NODE_TYPE, DEFAULT_HTML_TEMPLATE, HTML_TEMPLATE_PLACEHOLDER } from './node-html-template'
export { nodeStateMachine, STATE_MACHINE_NODE_TYPE } from './node-state-machine'
export {
  STATE_MACHINE_MODES,
  DEFAULT_STATE_MACHINE_MODE,
  readStateMachineMode,
  type StateMachineMode
} from './state-machine-modes'
export {
  stateMachineWriteParameters,
  stateMachineReadParameters,
  stateMachineUpdateParameters,
  DEFAULT_STATE_KEY_TEMPLATE,
  DEFAULT_STATE_NAMESPACE,
  DEFAULT_STATE_EXPIRE_SECONDS
} from './state-node-parameters'
export { stateMachineNodeOutputDefs } from './state-node-output-defs'
export {
  filterStateMachineInspectorForms,
  visibleStateMachineFormFieldNames,
  isStateMachineFormFieldVisible
} from './state-node-form-fields'
export {
  partitionStateMachineParameters,
  mergeStateParametersForModeChange,
  stateMachineBuiltinParamNames,
  isStateMachineBuiltinParam
} from './state-node-builtin-params'
export {
  STATE_MACHINE_MODE_SECTION_TITLE,
  STATE_MACHINE_INPUT_SECTION_TITLE,
  STATE_MACHINE_DEFAULT_PARAMS_TITLE
} from './state-node-section-headings'
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
export {
  nodeLlmApi,
  LLMAPI_NODE_TYPE,
  DEFAULT_LLMAPI_PROVIDER,
  DEFAULT_LLMAPI_MODEL_NAME,
  LLMAPI_PROVIDER_OPTIONS,
  LLMAPI_MODELS_BY_PROVIDER,
  LLMAPI_PROVIDER_DEFAULT_MODEL,
  LLMAPI_MODEL_OPTIONS,
  normalizeLlmApiProvider,
  getLlmApiModelOptions,
  resolveLlmApiModelForProvider,
  inferLlmApiProviderFromUrl,
  isLlmApiTemplateValue
} from './node-llmapi'
export {
  buildLlmApiProviderModelPatch,
  buildLlmApiApiKeyPatch
} from './llmapi-param-sync'
export {
  llmApiNodeDefaultParameters,
  llmApiUserMessageParameter,
  llmApiModelProviderParameter,
  llmApiModelNameParameter,
  llmApiApiKeyParameter,
  LLMAPI_BINDABLE_PARAM_NAMES,
  createLlmApiBindableParameter
} from './llmapi-node-parameters'
export { nodeWebSearch, WEB_SEARCH_NODE_TYPE } from './node-web-search'
export {
  WEB_SEARCH_ENGINE_OPTIONS,
  DEFAULT_WEB_SEARCH_ENGINES,
  normalizeWebSearchEngines
} from './web-search-engines'
export type { WebSearchEngineOption } from './web-search-engines'
export {
  webSearchNodeDefaultParameters,
  webSearchKeywordParameter,
  webSearchLimitParameter
} from './web-search-node-parameters'
export { webSearchNodeOutputDefs } from './web-search-node-output-defs'
export { nodeFetchUrl, FETCH_URL_NODE_TYPE, DEFAULT_FETCH_URL_MAX_CHARS } from './node-fetch-url'
export { fetchUrlNodeDefaultParameters, fetchUrlParameter, fetchUrlsParameter } from './fetch-url-node-parameters'
export { fetchUrlNodeOutputDefs } from './fetch-url-node-output-defs'
export {
  nodeImageGen,
  IMAGE_GEN_NODE_TYPE,
  DEFAULT_IMAGE_GEN_BASE_URL,
  DEFAULT_IMAGE_GEN_MODEL,
  DEFAULT_IMAGE_GEN_SIZE,
  DEFAULT_IMAGE_GEN_PROVIDER,
  DEFAULT_IMAGE_GEN_PROMPT_TEMPLATE,
  DEFAULT_IMAGE_GEN_TIMEOUT_MS,
  DEFAULT_IMAGE_GEN_EXTRA_BODY,
  DASHSCOPE_IMAGE_GEN_BASE_URL,
  DASHSCOPE_IMAGE_GEN_MODEL,
  DASHSCOPE_IMAGE_GEN_SIZE,
  DASHSCOPE_IMAGE_GEN_EXTRA_BODY
} from './node-image-gen'
export { imageGenNodeDefaultParameters, imageGenPromptParameter } from './image-gen-node-parameters'
export {
  imageGenImageUrlParameter,
  imageGenImageUrl2Parameter,
  imageGenImageUrl3Parameter
} from './image-gen-node-parameters'
export { imageGenNodeOutputDefs } from './image-gen-node-output-defs'
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
export {
  nodeEndApi,
  END_API_NODE_TYPE,
  DEFAULT_END_API_INCLUDE_EXECUTION_DETAILS
} from './node-end-api'
export { nodeCode } from './node-code'
