// API
export {
  configureFlowGameAuth,
  getToken,
  getFxToken
} from './api/auth'
export type { FlowGameAuthOptions } from './api/auth'
export {
  configureFlowGameClient,
  getFlowGameApiBaseURL,
  default as flowgameRequest
} from './api/client'
export type { FlowgameApiResponse, FlowGameClientOptions } from './api/client'

export * from './api/flow-game'
export * from './api/flow-game/constants'
export * from './api/flow-game/kb-collection'
export * from './api/flow-game/qdrant'
export * from './api/flow-game/redis'

// Custom nodes
export {
  flowGameCustomNodes,
  nodeHtmlTemplate,
  nodeMemoryRead,
  nodeMemoryWrite,
  HTML_TEMPLATE_NODE_TYPE,
  HTML_TEMPLATE_PLACEHOLDER,
  DEFAULT_HTML_TEMPLATE,
  MEMORY_READ_NODE_TYPE,
  MEMORY_WRITE_NODE_TYPE,
  memoryReadNodeOutputDefs,
  memoryWriteNodeOutputDefs,
  memoryReadNodeDefaultParameters,
  nodeStateMachine,
  STATE_MACHINE_NODE_TYPE,
  STATE_MACHINE_MODES,
  DEFAULT_STATE_MACHINE_MODE,
  stateMachineNodeOutputDefs,
  stateMachineWriteParameters,
  readStateMachineMode,
  filterStateMachineInspectorForms,
  partitionStateMachineParameters,
  mergeStateParametersForModeChange,
  isStateMachineBuiltinParam,
  STATE_MACHINE_MODE_SECTION_TITLE,
  STATE_MACHINE_INPUT_SECTION_TITLE,
  STATE_MACHINE_DEFAULT_PARAMS_TITLE,
  htmlTemplateNodeDefaultParameters,
  nodeDatabase,
  DATABASE_NODE_TYPE,
  DEFAULT_DATABASE_SQL,
  databaseNodeOutputDefs,
  nodeFork,
  FORK_NODE_TYPE,
  nodeJoinAll,
  JOIN_ALL_NODE_TYPE,
  nodeJoinAny,
  JOIN_ANY_NODE_TYPE,
  forkNodeOutputDefs,
  joinAllNodeOutputDefs,
  joinAnyNodeOutputDefs,
  nodeIf,
  IF_NODE_TYPE,
  DEFAULT_IF_CONDITION,
  ifNodeOutputDefs,
  nodeSwitch,
  SWITCH_NODE_TYPE,
  DEFAULT_SWITCH_PARAM,
  switchNodeOutputDefs,
  appendElseIfBranch,
  ifBranchSelectLabel,
  ifBranchTypeLabel,
  parseIfBranches,
  removeElseIfBranch,
  defaultIfBranches,
  SWITCH_ELSE_CASE_ID,
  appendSwitchCase,
  parseSwitchCases,
  removeSwitchCase,
  defaultSwitchCases,
  readSwitchParamName,
  switchCaseSelectLabel,
  nodeOss,
  OSS_NODE_TYPE,
  DEFAULT_OSS_OBJECT_KEY_TEMPLATE,
  OSS_FILE_TYPES,
  DEFAULT_OSS_FILE_TYPE,
  getOssFileTypeMeta,
  ossNodeDefaultParameters,
  ossNodeOutputDefs,
  nodeWebSearch,
  WEB_SEARCH_NODE_TYPE,
  WEB_SEARCH_ENGINE_OPTIONS,
  DEFAULT_WEB_SEARCH_ENGINES,
  normalizeWebSearchEngines,
  webSearchNodeDefaultParameters,
  webSearchNodeOutputDefs,
  nodeFetchUrl,
  FETCH_URL_NODE_TYPE,
  DEFAULT_FETCH_URL_MAX_CHARS,
  fetchUrlNodeDefaultParameters,
  fetchUrlNodeOutputDefs,
  fetchUrlsParameter,
  nodeImageGen,
  IMAGE_GEN_NODE_TYPE,
  DEFAULT_IMAGE_GEN_BASE_URL,
  DEFAULT_IMAGE_GEN_MODEL,
  DEFAULT_IMAGE_GEN_SIZE,
  imageGenNodeDefaultParameters,
  imageGenNodeOutputDefs
} from './nodes'
export {
  nodeEndApi,
  END_API_NODE_TYPE,
  DEFAULT_END_API_INCLUDE_EXECUTION_DETAILS
} from './nodes/node-end-api'
export type { WebSearchEngineOption } from './nodes'
export type { OssFileType } from './nodes/oss-file-types'
export type { StateMachineMode } from './nodes/state-machine-modes'
export type { IfBranchDef, IfBranchType } from './nodes/if-branches'
export type { SwitchCaseDef } from './nodes/switch-cases'

// Workflow
export { initialData } from './workflow/initial-data'
export { normalizeKnowledgeNodeParams } from './workflow/normalize-knowledge-node-params'
export { normalizeLlmApiNodeParams } from './workflow/normalize-llmapi-node-params'
export { normalizeMemoryNodeParams } from './workflow/normalize-memory-node-params'
export { normalizeStateNodeParams, defaultStateParametersForMode } from './workflow/normalize-state-node-params'
export { deepMergePayload } from './workflow/state-payload-merge'
export { normalizeOssNodeParams } from './workflow/normalize-oss-node-params'
export { normalizeWebSearchNodeParams } from './workflow/normalize-web-search-node-params'
export { normalizeFetchUrlNodeParams } from './workflow/normalize-fetch-url-node-params'
export { normalizeImageGenNodeParams } from './workflow/normalize-image-gen-node-params'
export {
  normalizeEndApiNodeParams,
  syncEndApiParamsAndOutputDefs,
  syncEndApiFromParameters,
  syncEndApiFromOutputDefs,
  findEndApiNodes,
  hasEndApiNode,
  patchEndApiNodeDom
} from './workflow/normalize-end-api-node-params'
export { syncEndApiCanvasParams } from './nodes/end-api-canvas'
export { normalizeHtmlTemplateNodeParams } from './workflow/normalize-html-template-node-params'
export { normalizeTalkStartNodeParams } from './workflow/normalize-talk-start-node-params'
export { normalizeCodeNodeParams } from './workflow/normalize-code-node-params'
export {
  defaultMemoryWriteParameters,
  parseMemoryWriteGroups,
  appendMemoryWriteGroup,
  removeMemoryWriteGroupBySuffix,
  contextKeyParamName,
  memoryValueParamName,
  type MemoryWriteGroupView
} from './workflow/memory-write-groups'
export { formatHtmlTemplate } from './workflow/format-html-template'
export { formatIfConditionTemplate } from './workflow/format-if-condition'
export { wrapHtmlPreviewDocument } from './workflow/html-preview-document'
export {
  buildHtmlTemplatePreviewMap,
  mergeHtmlTemplatePreviewMap
} from './workflow/html-template-preview-map'
export { readHtmlTemplateFromNodeBody, resolveHtmlTemplateSource } from './workflow/read-html-template-source'
export { applyHtmlPreviewToIframe, disposeHtmlPreviewIframe } from './workflow/html-preview-iframe'
export { collapseAllNodePanels, ensureNodeExpandDefault } from './workflow/normalize-node-expand'
export { syncMethodKeyInWorkflow } from './workflow/sync-method-key'
export {
  hasStartApiNode,
  isStartApiWorkflowChanged,
  normalizeStartApiWorkflow,
  patchStartApiNodeDom,
  START_NODE_TYPE,
  validateStartApiWorkflow,
  findStartApiNodes
} from './workflow/workflow-start-api-rules'
export type { StartApiWorkflowIssue } from './workflow/workflow-start-api-rules'
export {
  ASSISTANT_MESSAGE_OUTPUT_NAME,
  findStartTalkNodes,
  hasStartTalkNode,
  isTalkStartWorkflowChanged,
  normalizeTalkStartWorkflow,
  patchTalkStartNodeDom,
  START_TALK_NODE_TYPE,
  validateTalkStartWorkflow
} from './workflow/workflow-talk-rules'
export type { TalkStartWorkflowIssue } from './workflow/workflow-talk-rules'
export {
  findForkNodes,
  findJoinNodes,
  validateParallelForkJoinWorkflow
} from './workflow/workflow-parallel-fork-join-rules'
export type { ParallelForkJoinIssue } from './workflow/workflow-parallel-fork-join-rules'
export {
  findIfNodes,
  mergeIfNodeBranchEdgeMap,
  normalizeIfWorkflow,
  readEdgeBranch,
  validateIfWorkflow
} from './workflow/workflow-if-rules'
export type { IfWorkflowIssue } from './workflow/workflow-if-rules'
export {
  findSwitchNodes,
  normalizeSwitchWorkflow,
  validateSwitchWorkflow
} from './workflow/workflow-switch-rules'
export type { SwitchWorkflowIssue } from './workflow/workflow-switch-rules'
export { buildWorkflowRunPlan } from './workflow/build-workflow-run-plan'
export {
  buildWorkflowVariableTree,
  buildUpstreamRefSelectTree
} from './workflow/build-workflow-variable-tree'
export type { WorkflowVariableTreeNode, RefSelectTreeNode } from './workflow/build-workflow-variable-tree'
export * from './workflow/output-def-tree'
export * from './workflow/flow-run-types'
export * from './workflow/parse-flow-execute-result'

// Tinyflow helpers
export * from './tinyflow/tinyflow-host'
export * from './tinyflow/tinyflow-flow-api'
export * from './tinyflow/canvas-toolbar-nodes'

// Patches
export { patchCanvasControlsPosition } from './patches/patch-canvas-controls-position'
export { patchCanvasMinimapStyle, setCanvasMinimapVisible } from './patches/patch-canvas-minimap-style'
export { patchCanvasNodePopover } from './patches/patch-canvas-node-popover'
export { patchBranchNodeCanvasDom } from './patches/patch-branch-node-canvas'
export {
  configureCanvasWatermark,
  DEFAULT_CANVAS_WATERMARK,
  getCanvasWatermark,
  patchCanvasWatermark
} from './patches/patch-canvas-watermark'
export {
  cleanupNodeInspectorTrigger,
  FLOWGAME_OPEN_NODE_INSPECTOR_EVENT,
  patchNodeInspectorTrigger
} from './patches/patch-node-inspector-trigger'
export {
  FLOWGAME_ASSIGN_BRANCH_EDGE_EVENT,
  readBranchEdgeMap,
  selectedEdgeIdForBranch,
  syncIfNodeBranchEdgeMap
} from './nodes/branch-edge-canvas'
export {
  FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT,
  FLOWGAME_OPEN_FLOW_LIST_EVENT,
  FLOWGAME_OPEN_AGENT_TEAM_EVENT,
  FLOWGAME_OPEN_DIGITAL_EMPLOYEE_EVENT,
  FLOWGAME_OPEN_SESSION_ROBOT_EVENT,
  patchFlowToolbarVariables
} from './patches/patch-flow-toolbar-variables'

// Multi-agent team (frontend scaffold; backend APIs later)
export type {
  AgentTeamDef,
  AgentTeamHarness,
  AgentTeamMember,
  AgentTeamStrategy,
  FlowAgentConfig,
  FlowAgentSchemaField
} from './team/types'
export {
  AGENT_TEAM_STRATEGY_OPTIONS,
  DEFAULT_BLACKBOARD_DEFAULT_KEYS,
  DEFAULT_STATUS_CARD_KEYS,
  createEmptyAgentConfig,
  createEmptyAgentTeam,
  defaultAgentTeamHarness,
  formatBlackboardDefaults,
  normalizeStatusCardKeys,
  parseBlackboardDefaults,
  parseStatusCardKeys
} from './team/types'
export {
  createAgentTeam,
  deleteAgentTeam,
  getAgentTeam,
  getFlowAgentConfig,
  listAgentTeams,
  listFlowAgentConfigs,
  saveAgentTeam,
  saveFlowAgentConfig,
  seedContentSupervisorTeam,
  upsertFlowAgentConfigFromFlow
} from './team/local-store'
export type { SeedTeamTemplateResult } from './team/local-store'
export {
  CONTENT_SUPERVISOR_AGENT_KEY,
  CONTENT_SUPERVISOR_BLUEPRINTS,
  CONTENT_SUPERVISOR_TEAM_KEY,
  MASTER_SYSTEM_PROMPT,
  SUPERVISOR_DECISION_SCHEMA,
  buildContentSupervisorAgentConfigs,
  buildContentSupervisorTeamDef
} from './team/templates/content-supervisor'
export type { AgentFlowBlueprint } from './team/templates/content-supervisor'
export {
  INTEL_DECISION_SCHEMA,
  INTEL_MASTER_SYSTEM_PROMPT,
  INTEL_MASTER_SYSTEM_PROMPT_FILLED,
  INTEL_MASTER_USER_TEMPLATE,
  INTEL_SUPERVISOR_AGENT_KEY,
  INTEL_SUPERVISOR_TEAM_KEY
} from './team/templates/intel-supervisor'
export { patchFlowToolbarNodeCategories } from './patches/patch-flow-toolbar-node-categories'
export {
  FLOWGAME_NODE_CATEGORIES,
  getSortedNodeCategories,
  registerNodeCategories,
  registerNodeTypeCategories,
  resolveNodeCategory
} from './nodes/node-category-registry'
export type { FlowGameNodeCategory } from './nodes/node-category-registry'

// Inspector utilities
export * from './inspector/node-inspector-config'
export * from './inspector/knowledge-node-parameters'
export * from './inspector/knowledge-node-inspector'
export * from './inspector/knowledge-node-output-defs'
export * from './inspector/code-node-inspector'
export { BUILTIN_NODE_ICONS } from './inspector/node-type-icons'
export { KNOWLEDGE_BASE_FIELD_LABEL } from './nodes/knowledge-base-picker'
