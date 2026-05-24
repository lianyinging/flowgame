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
export { flowGameCustomNodes } from './nodes'

// Workflow
export { initialData } from './workflow/initial-data'
export { normalizeKnowledgeNodeParams } from './workflow/normalize-knowledge-node-params'
export { normalizeLlmApiNodeParams } from './workflow/normalize-llmapi-node-params'
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
export { patchCanvasWatermark } from './patches/patch-canvas-watermark'
export {
  cleanupNodeInspectorTrigger,
  FLOWGAME_OPEN_NODE_INSPECTOR_EVENT,
  patchNodeInspectorTrigger
} from './patches/patch-node-inspector-trigger'
export {
  FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT,
  FLOWGAME_OPEN_FLOW_LIST_EVENT,
  patchFlowToolbarVariables
} from './patches/patch-flow-toolbar-variables'

// Inspector utilities
export * from './inspector/node-inspector-config'
export * from './inspector/knowledge-node-parameters'
export * from './inspector/knowledge-node-inspector'
export * from './inspector/knowledge-node-output-defs'
export * from './inspector/code-node-inspector'
export { BUILTIN_NODE_ICONS } from './inspector/node-type-icons'
export { KNOWLEDGE_BASE_FIELD_LABEL } from './nodes/knowledge-base-picker'
