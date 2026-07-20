<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from 'vue'
import { Form, FormItem, Input, Message, Modal, Spin } from '@arco-design/web-vue'
import { Tinyflow } from '@tinyflow-ai/ui'
import type { TinyflowData, TinyflowOptions } from '@tinyflow-ai/ui'
import '@tinyflow-ai/ui/dist/index.css'
import {
  buildFlowRedisKey,
  buildKbBaseSelectOptions,
  buildWorkflowRunPlan,
  cleanupNodeInspectorTrigger,
  clonePlainWorkflow,
  collapseAllNodePanels,
  executeFlowGameStreamApi,
  ensureNodeExpandDefault,
  flowGameCustomNodes,
  FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT,
  FLOWGAME_OPEN_FLOW_LIST_EVENT,
  FLOWGAME_OPEN_NODE_INSPECTOR_EVENT,
  FLOWGAME_ASSIGN_BRANCH_EDGE_EVENT,
  flowRedisKeysForLoad,
  getFlowListRedisPrefix,
  getRedisApi,
  getTinyflowFlowApi,
  getTinyflowHostRoot,
  getWorkflowFromTinyflow,
  mergeWorkflowEdgeData,
  mergeIfNodeBranchEdgeMap,
  hasStartApiNode,
  initialData,
  isFlowRunFailed,
  isStartApiWorkflowChanged,
  isTalkStartWorkflowChanged,
  listKbBasesCached,
  normalizeHtmlTemplateNodeParams,
  normalizeKnowledgeNodeParams,
  normalizeCodeNodeParams,
  normalizeLlmApiNodeParams,
  normalizeMemoryNodeParams,
  normalizeStateNodeParams,
  normalizeOssNodeParams,
  normalizeStartApiWorkflow,
  normalizeTalkStartNodeParams,
  normalizeTalkStartWorkflow,
  parseFlowNameFromRedisKey,
  parseIfBranches,
  IF_NODE_TYPE,
  parseSwitchCases,
  SWITCH_ELSE_CASE_ID,
  SWITCH_NODE_TYPE,
  parseFlowRunSummary,
  parseNodeExecutions,
  parseStreamNodeFinished,
  parseStreamNodeStarted,
  patchCanvasControlsPosition,
  patchCanvasMinimapStyle,
  patchCanvasNodePopover,
  patchCanvasWatermark,
  patchFlowToolbarVariables,
  patchNodeInspectorTrigger,
  patchStartApiNodeDom,
  patchBranchNodeCanvasDom,
  patchTalkStartNodeDom,
  saveFlowWorkflowApi,
  selectCanvasNode,
  setCanvasMinimapVisible,
  START_NODE_TYPE,
  syncMethodKeyInWorkflow,
  syncIfNodeBranchEdgeMap,
  syncWorkflowNodesToCanvas,
  validateParallelForkJoinWorkflow,
  validateIfWorkflow,
  normalizeIfWorkflow,
  validateSwitchWorkflow,
  normalizeSwitchWorkflow,
  readEdgeBranch,
  readBranchEdgeMap,
  validateStartApiWorkflow,
  validateTalkStartWorkflow
} from '@flowgame/core'
import type {
  FlowListIndexItem,
  FlowNodeExecution,
  FlowParameter,
  FlowRunViewState,
  FlowStreamEventName,
  InspectorFlowNode
} from '@flowgame/core'
import useLoading from './hooks/useLoading'
import type { FlowEditorFormMode } from './types'
import { displayFlowEditorName, resolveInitialEditorFormMode } from './flow-editor-mode'
import VariableTreeContent from './components/flow-editor/VariableTreeContent.vue'
import NodeInspectorPanel from './components/flow-editor/NodeInspectorPanel.vue'
import CanvasFloatingToolbar from './components/flow-editor/CanvasFloatingToolbar.vue'
import FlowRunProgressModal from './components/flow-editor/FlowRunProgressModal.vue'
import FlowListPanelModal from './components/flow-editor/FlowListPanelModal.vue'
import FlowKnowledgePanelModal from './components/flow-editor/FlowKnowledgePanelModal.vue'

const props = withDefaults(defineProps<{
  /** 只读查看模式 */
  readonly?: boolean
  /** 流程名称（与 redisKey 二选一或同时传） */
  flowName?: string
  /** Redis 中的流程键 */
  redisKey?: string
  /** 内置流程列表、知识库弹窗（默认开启，接入方无需再写 Modal） */
  builtinBusinessModals?: boolean
  /**
   * 画布背景 / 节点角标品牌水印。
   * 不传则用 configureFlowGameClient({ canvasWatermark }) 或默认 FlowGame.ai
   */
  canvasWatermark?: string
}>(), {
  readonly: false,
  flowName: '',
  redisKey: '',
  builtinBusinessModals: true,
  canvasWatermark: undefined
})

const emit = defineEmits<{
  'open-flow-list': []
  'open-flow-knowledge': []
  saved: [payload: { flowName: string }]
  executed: [payload: { phase: 'success' | 'error' }]
}>()

const saveVisible = ref(false)
const saveLoading = ref(false)
const saveForm = reactive({ flowName: '' })

const editorFormMode = ref<FlowEditorFormMode>(
  resolveInitialEditorFormMode({
    readonly: props.readonly,
    redisKey: props.redisKey,
    flowName: props.flowName
  })
)
const isViewMode = computed(() => editorFormMode.value === 'view')
const toolbarFlowName = computed(() =>
  displayFlowEditorName(saveForm.flowName, editorFormMode.value)
)
const pageLoading = ref(false)
const canvasRef = ref<HTMLElement>()
const tinyflowRef = shallowRef<Tinyflow>()
const workflowSnapshot = ref<TinyflowData>(initialData)
const varsToolbarMount = ref<HTMLElement | null>(null)
const runVisible = ref(false)
const runState = reactive<FlowRunViewState>({
  phase: 'running',
  plan: [],
  executions: [],
  summary: null
})
const saveFlowRedisKeyPlaceholder = computed(
  () => `Redis Key：${getFlowListRedisPrefix()}流程名称`
)
const syncingMethodKey = ref(false)
const syncingInspector = ref(false)
const inspectorNodeId = ref<string | null>(null)
const minimapVisible = ref(true)
const flowListPanelVisible = ref(false)
const flowKnowledgePanelVisible = ref(false)
const selectedNode = computed<InspectorFlowNode | null>(() => {
  if (!inspectorNodeId.value)
    return null
  const nodes = (workflowSnapshot.value.nodes ?? []) as InspectorFlowNode[]
  return nodes.find(n => n.id === inspectorNodeId.value) ?? null
})

let lastStartApiRuleWarnAt = 0
let lastTalkStartRuleWarnAt = 0
let runAbortController: AbortController | null = null
const { loading, setLoading } = useLoading()

function applyWorkflowRules(
  workflow: typeof initialData,
  options?: { silent?: boolean, skipSetData?: boolean }
) {
  const before = workflow
  const afterStartApi = normalizeStartApiWorkflow(workflow)
  const afterTalk = normalizeTalkStartWorkflow(afterStartApi)
  /** 仅当「Api接口开始」规则实际改动了 nodes/edges 时再提示（避免加普通节点误报） */
  const startApiStructureChanged = isStartApiWorkflowChanged(workflow, afterStartApi)
  const talkStartStructureChanged = isTalkStartWorkflowChanged(afterStartApi, afterTalk)
  let next = ensureNodeExpandDefault(
    normalizeSwitchWorkflow(
      normalizeIfWorkflow(
        normalizeOssNodeParams(
          normalizeHtmlTemplateNodeParams(
            normalizeMemoryNodeParams(
              normalizeStateNodeParams(
                normalizeLlmApiNodeParams(
                  normalizeCodeNodeParams(
                    normalizeKnowledgeNodeParams(
                      normalizeTalkStartNodeParams(afterTalk)
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  )
  if (saveForm.flowName.trim())
    next = syncMethodKeyInWorkflow(next, saveForm.flowName.trim())

  if (startApiStructureChanged && !options?.silent) {
    const now = Date.now()
    if (now - lastStartApiRuleWarnAt > 2500) {
      Message.warning('「Api接口开始」仅可作为流程起点，已自动修正连线')
      lastStartApiRuleWarnAt = now
    }
  }

  if (talkStartStructureChanged && !options?.silent) {
    const now = Date.now()
    if (now - lastTalkStartRuleWarnAt > 2500) {
      Message.warning('「对话开始」仅可作为流程起点，已自动修正连线')
      lastTalkStartRuleWarnAt = now
    }
  }

  const dataChanged = JSON.stringify(workflow) !== JSON.stringify(next)
  if (tinyflowRef.value && dataChanged) {
    if (startApiStructureChanged || talkStartStructureChanged || !options?.skipSetData) {
      syncingMethodKey.value = true
      tinyflowRef.value.setData(next)
      syncingMethodKey.value = false
    }
    else {
      syncWorkflowNodesToCanvas(tinyflowRef.value, before, next)
    }
  }

  requestAnimationFrame(() => {
    patchStartApiNodeDom(canvasRef.value ?? undefined, next)
    patchTalkStartNodeDom(canvasRef.value ?? undefined, next)
    patchBranchNodeCanvasDom(canvasRef.value ?? undefined, next)
    refreshToolbarVariables()
  })

  workflowSnapshot.value = next
  return next
}

function assignBranchEdgeFromInspector(payload: { nodeId: string, branchId: string, edgeId: string }) {
  if (!tinyflowRef.value || isViewMode.value)
    return

  const edgeId = payload.edgeId?.trim() ?? ''
  syncingInspector.value = true
  try {
    const edges = (workflowSnapshot.value.edges ?? []).map((edge) => {
      if (edge.source !== payload.nodeId)
        return edge
      const data = { ...(edge.data ?? {}) } as Record<string, unknown>
      if (!edgeId) {
        if (readEdgeBranch(edge) === payload.branchId) {
          delete data.branch
          return { ...edge, data }
        }
        return edge
      }
      if (edge.id === edgeId) {
        return { ...edge, data: { ...data, branch: payload.branchId } }
      }
      if (readEdgeBranch(edge) === payload.branchId) {
        delete data.branch
        return { ...edge, data }
      }
      return edge
    })
    const nodes = (workflowSnapshot.value.nodes ?? []).map((node) => {
      if (node.id !== payload.nodeId)
        return node
      if (node.type !== IF_NODE_TYPE && node.type !== SWITCH_NODE_TYPE)
        return node
      const data = { ...(node.data ?? {}) } as Record<string, unknown>
      const branchIds = node.type === IF_NODE_TYPE
        ? parseIfBranches(data).map(b => b.id)
        : [...parseSwitchCases(data).map(c => c.id), SWITCH_ELSE_CASE_ID]
      if (!edgeId) {
        const map = readBranchEdgeMap(data)
        delete map[payload.branchId]
        data.branchEdgeMap = map
      }
      else {
        syncIfNodeBranchEdgeMap(data, payload.nodeId, edges, branchIds)
      }
      return { ...node, data }
    })
    applyWorkflowRules({ ...workflowSnapshot.value, nodes, edges }, { silent: true, skipSetData: true })
  }
  finally {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncingInspector.value = false
      })
    })
  }
}

function patchEdgeFromInspector(payload: { edgeId: string, data: Record<string, unknown> }) {
  if (!tinyflowRef.value || isViewMode.value)
    return

  syncingInspector.value = true
  try {
    const edges = (workflowSnapshot.value.edges ?? []).map((edge) => {
      if (edge.id !== payload.edgeId)
        return edge
      return {
        ...edge,
        data: {
          ...(edge.data ?? {}),
          ...payload.data
        }
      }
    })
    const merged: typeof initialData = {
      ...workflowSnapshot.value,
      edges
    }
    applyWorkflowRules(merged, { silent: true, skipSetData: true })
  }
  finally {
    syncingInspector.value = false
  }
}

function patchNodeFromInspector(
  nodeId: string,
  patch: {
    data?: Record<string, unknown>
    parameters?: FlowParameter[]
    outputDefs?: FlowParameter[]
  }
) {
  if (!tinyflowRef.value || isViewMode.value)
    return
  if (!getTinyflowFlowApi(tinyflowRef.value)) {
    Message.warning('画布未就绪，请稍后再编辑')
    return
  }

  syncingInspector.value = true
  try {
    const snapshotNodes = workflowSnapshot.value.nodes ?? []
    const nodes = snapshotNodes.map((node) => {
      if (node.id !== nodeId)
        return node
      const data = {
        ...(node.data ?? {}),
        ...(patch.data ?? {})
      }
      if (patch.parameters)
        data.parameters = patch.parameters
      if (patch.outputDefs)
        data.outputDefs = patch.outputDefs
      return {
        ...node,
        data,
        selected: node.id === inspectorNodeId.value ? true : node.selected
      }
    })
    const merged: typeof initialData = {
      ...workflowSnapshot.value,
      nodes,
      edges: workflowSnapshot.value.edges ?? []
    }
    const next = applyWorkflowRules(merged, { silent: true, skipSetData: true })
    // 归一化前后 JSON 可能相同，会跳过 syncWorkflowNodesToCanvas，需显式同步到画布节点内表单
    const target = next.nodes?.find(n => n.id === nodeId)
    const api = getTinyflowFlowApi(tinyflowRef.value)
    if (api && target?.data && typeof target.data === 'object')
      api.updateNodeData(nodeId, clonePlainWorkflow(target.data) as Record<string, unknown>)
    requestAnimationFrame(() => {
      patchStartApiNodeDom(canvasRef.value ?? undefined, workflowSnapshot.value)
      patchTalkStartNodeDom(canvasRef.value ?? undefined, workflowSnapshot.value)
    })
  }
  finally {
    syncingInspector.value = false
  }
}

function onInspectorPatchData(payload: { nodeId: string, data: Record<string, unknown> }) {
  patchNodeFromInspector(payload.nodeId, { data: payload.data })
}

function onInspectorPatchParameters(payload: { nodeId: string, parameters: FlowParameter[] }) {
  patchNodeFromInspector(payload.nodeId, { parameters: payload.parameters })
}

function onInspectorPatchOutputDefs(payload: { nodeId: string, outputDefs: FlowParameter[] }) {
  patchNodeFromInspector(payload.nodeId, { outputDefs: payload.outputDefs })
}

function assertWorkflowSaveValid(workflow: typeof initialData) {
  const issues = [
    ...validateStartApiWorkflow(workflow),
    ...validateTalkStartWorkflow(workflow)
  ]
  if (issues.length > 0) {
    Message.warning(issues[0].message)
    return false
  }
  return true
}

function assertWorkflowRunnable(workflow: typeof initialData) {
  const issues = [
    ...validateStartApiWorkflow(workflow),
    ...validateTalkStartWorkflow(workflow),
    ...validateParallelForkJoinWorkflow(workflow),
    ...validateIfWorkflow(workflow),
    ...validateSwitchWorkflow(workflow)
  ]
  if (!issues.length)
    return true

  Modal.warning({
    title: '无法试运行',
    content: issues.map((issue, index) => `${index + 1}. ${issue.message}`).join('\n'),
    okText: '知道了'
  })
  return false
}

const provider: TinyflowOptions['provider'] = {
  llm: () => [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  knowledge: async () => {
    try {
      const items = await listKbBasesCached()
      if (!items.length)
        return [{ value: '', label: '请先在「知识库配置」创建知识库' }]
      return buildKbBaseSelectOptions(items)
    }
    catch {
      return [{ value: '', label: '加载 Collection 失败' }]
    }
  },
  searchEngine: () => [{ value: 'bing', label: 'Bing 搜索' }]
}

function parseWorkflowFromRedisValue(value: unknown): typeof initialData | null {
  if (!value || typeof value !== 'object')
    return null
  const obj = value as Record<string, unknown>
  if (obj.workflow && typeof obj.workflow === 'object')
    return obj.workflow as typeof initialData
  if (Array.isArray(obj.nodes) || Array.isArray(obj.edges))
    return obj as typeof initialData
  return null
}

async function loadWorkflowByRedisKey(redisKey: string) {
  pageLoading.value = true
  try {
    let res: Awaited<ReturnType<typeof getRedisApi>> | null = null
    let resolvedKey = redisKey
    for (const key of flowRedisKeysForLoad(redisKey)) {
      const attempt = await getRedisApi(key)
      if (attempt.data?.exists) {
        res = attempt
        resolvedKey = key
        break
      }
    }
    if (!res?.data?.exists) {
      Message.warning('流程数据不存在')
      return null
    }
    const workflow = parseWorkflowFromRedisValue(res.data?.value)
    if (!workflow) {
      Message.warning('流程数据格式无效')
      return null
    }
    saveForm.flowName = parseFlowNameFromRedisKey(resolvedKey)
    return collapseAllNodePanels(
      applyWorkflowRules(
        syncMethodKeyInWorkflow(workflow, saveForm.flowName),
        { silent: true }
      )
    )
  }
  catch {
    Message.warning('加载流程数据失败')
    return null
  }
  finally {
    pageLoading.value = false
  }
}

function applyWorkflowToCanvas(data: typeof initialData) {
  if (!tinyflowRef.value)
    return
  syncingMethodKey.value = true
  tinyflowRef.value.setData(data)
  syncingMethodKey.value = false
  workflowSnapshot.value = data
  inspectorNodeId.value = null
  requestAnimationFrame(() => {
    patchStartApiNodeDom(canvasRef.value ?? undefined, data)
  })
}

async function openFlowFromListPanel(payload: { mode: FlowEditorFormMode, record?: FlowListIndexItem }) {
  editorFormMode.value = payload.mode
  if (payload.mode === 'add') {
    saveForm.flowName = ''
    applyWorkflowToCanvas(collapseAllNodePanels(applyWorkflowRules(initialData, { silent: true })))
    return
  }
  const redisKey = payload.record?.redisKey
  if (!redisKey)
    return
  if (payload.record?.name?.trim())
    saveForm.flowName = payload.record.name.trim()
  else
    saveForm.flowName = parseFlowNameFromRedisKey(redisKey)
  const data = await loadWorkflowByRedisKey(redisKey)
  if (!data)
    return
  applyWorkflowToCanvas(data)
  if (payload.mode === 'view')
    inspectorNodeId.value = null
}

function onOpenFlowListPanel() {
  if (props.builtinBusinessModals)
    flowListPanelVisible.value = true
  else
    emit('open-flow-list')
}

function onOpenFlowKnowledgePanel() {
  if (props.builtinBusinessModals)
    flowKnowledgePanelVisible.value = true
  else
    emit('open-flow-knowledge')
}

function onOpenFlowFromListPanel(payload: { mode: FlowEditorFormMode, record?: FlowListIndexItem }) {
  void openFlowFromListPanel(payload)
}

async function loadWorkflowData() {
  const redisKeyFromProps = props.redisKey.trim()
  const nameFromProps = props.flowName.trim()
  const redisKey = redisKeyFromProps || (nameFromProps ? buildFlowRedisKey(nameFromProps) : '')

  if (!redisKey)
    return initialData

  if (nameFromProps)
    saveForm.flowName = nameFromProps
  else if (redisKeyFromProps)
    saveForm.flowName = parseFlowNameFromRedisKey(redisKeyFromProps)

  const data = await loadWorkflowByRedisKey(redisKey)
  return data ?? initialData
}

async function reloadFromProps() {
  const data = await loadWorkflowData()
  if (tinyflowRef.value)
    applyWorkflowToCanvas(data)
  else
    initTinyflow(data)
}

function syncMethodKeyToCanvas() {
  if (!tinyflowRef.value || syncingMethodKey.value)
    return
  applyWorkflowRules(
    getWorkflowFromTinyflow(tinyflowRef.value, workflowSnapshot.value),
    { silent: true }
  )
}

watch(() => saveForm.flowName, () => {
  syncMethodKeyToCanvas()
})

watch(
  () => [props.redisKey, props.flowName, props.readonly] as const,
  ([redisKey, flowName, readonly]) => {
    if (readonly) {
      editorFormMode.value = 'view'
    }
    else if (editorFormMode.value === 'view') {
      editorFormMode.value = redisKey.trim() || flowName.trim() ? 'edit' : 'add'
    }
    void reloadFromProps()
  }
)

let toolbarVarsObserver: MutationObserver | null = null
let toolbarPatchRaf = 0
let inspectorHeightObserver: ResizeObserver | null = null
const inspectorPanelHeight = ref<number | null>(null)

const inspectorPanelStyle = computed(() => {
  const h = inspectorPanelHeight.value
  if (!h || h <= 0)
    return undefined
  return { height: `${h}px` }
})

function readLeftToolbarContainerHeight() {
  const container = getTinyflowHostRoot(canvasRef.value ?? undefined)
    ?.querySelector('.tf-toolbar-container') as HTMLElement | null
  if (!container)
    return null
  return Math.ceil(container.getBoundingClientRect().height)
}

function syncInspectorPanelHeight() {
  inspectorPanelHeight.value = readLeftToolbarContainerHeight()
}

function setupInspectorHeightSync() {
  inspectorHeightObserver?.disconnect()
  const container = getTinyflowHostRoot(canvasRef.value ?? undefined)
    ?.querySelector('.tf-toolbar-container') as HTMLElement | null
  if (!container) {
    inspectorPanelHeight.value = null
    return
  }
  syncInspectorPanelHeight()
  inspectorHeightObserver = new ResizeObserver(() => syncInspectorPanelHeight())
  inspectorHeightObserver.observe(container)
}

function teardownInspectorHeightSync() {
  inspectorHeightObserver?.disconnect()
  inspectorHeightObserver = null
  inspectorPanelHeight.value = null
}

watch(inspectorNodeId, (id) => {
  if (id)
    syncInspectorPanelHeight()
})

watch(() => props.canvasWatermark, () => {
  patchCanvasWatermark(canvasRef.value ?? undefined, props.canvasWatermark)
})

function onMinimapVisibleChange(visible: boolean) {
  minimapVisible.value = visible
  setCanvasMinimapVisible(canvasRef.value ?? undefined, visible)
}

function refreshToolbarVariables() {
  patchCanvasWatermark(canvasRef.value ?? undefined, props.canvasWatermark)
  patchCanvasControlsPosition(canvasRef.value ?? undefined)
  patchCanvasMinimapStyle(canvasRef.value ?? undefined)
  patchCanvasNodePopover(canvasRef.value ?? undefined)
  patchNodeInspectorTrigger(canvasRef.value ?? undefined, { readonly: isViewMode.value })
  setCanvasMinimapVisible(canvasRef.value ?? undefined, minimapVisible.value)
  const mount = patchFlowToolbarVariables(canvasRef.value ?? undefined)
  if (mount)
    varsToolbarMount.value = mount
}

function onOpenNodeInspectorFromCanvas(event: Event) {
  const nodeId = (event as CustomEvent<{ nodeId?: string }>).detail?.nodeId?.trim()
  if (!nodeId || isViewMode.value)
    return
  inspectorNodeId.value = nodeId
  selectCanvasNode(tinyflowRef.value, nodeId)
}

function onAssignBranchEdgeFromCanvas(event: Event) {
  const detail = (event as CustomEvent<{ nodeId?: string, branchId?: string, edgeId?: string }>).detail
  const nodeId = detail?.nodeId?.trim()
  const branchId = detail?.branchId?.trim()
  if (!nodeId || !branchId || isViewMode.value)
    return
  assignBranchEdgeFromInspector({
    nodeId,
    branchId,
    edgeId: detail?.edgeId?.trim() ?? ''
  })
}

const CANVAS_TOOLBAR_PANEL_LISTENER_ATTR = 'data-flowgame-toolbar-panel-listeners'

function scheduleToolbarDomPatch() {
  if (toolbarPatchRaf)
    cancelAnimationFrame(toolbarPatchRaf)
  toolbarPatchRaf = requestAnimationFrame(() => {
    toolbarPatchRaf = 0
    refreshToolbarVariables()
    syncInspectorPanelHeight()
  })
}

function setupToolbarVariablesWatch() {
  toolbarVarsObserver?.disconnect()
  const canvas = canvasRef.value
  if (!canvas)
    return

  if (canvas.getAttribute(CANVAS_TOOLBAR_PANEL_LISTENER_ATTR) !== '1') {
    canvas.addEventListener(FLOWGAME_OPEN_FLOW_LIST_EVENT, onOpenFlowListPanel)
    canvas.addEventListener(FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT, onOpenFlowKnowledgePanel)
    canvas.addEventListener(FLOWGAME_OPEN_NODE_INSPECTOR_EVENT, onOpenNodeInspectorFromCanvas)
    canvas.addEventListener(FLOWGAME_ASSIGN_BRANCH_EDGE_EVENT, onAssignBranchEdgeFromCanvas)
    canvas.setAttribute(CANVAS_TOOLBAR_PANEL_LISTENER_ATTR, '1')
  }

  scheduleToolbarDomPatch()

  toolbarVarsObserver = new MutationObserver(() => scheduleToolbarDomPatch())
  toolbarVarsObserver.observe(canvas, { childList: true, subtree: true })
  setupInspectorHeightSync()
}

function initTinyflow(data: typeof initialData) {
  if (!canvasRef.value)
    return
  varsToolbarMount.value = null
  tinyflowRef.value?.destroy()
  const prepared = collapseAllNodePanels(applyWorkflowRules(data, { silent: true }))
  tinyflowRef.value = new Tinyflow({
    element: canvasRef.value,
    data: prepared,
    defaultTheme: 'light',
    formRefTypeEnable: true,
    provider,
    customNodes: flowGameCustomNodes,
    hiddenNodes: () => {
      const current = tinyflowRef.value
        ? getWorkflowFromTinyflow(tinyflowRef.value, workflowSnapshot.value)
        : workflowSnapshot.value
      const hidden: string[] = ['llmNode', 'knowledgeNode', 'searchEngineNode']
      if (hasStartApiNode(current))
        hidden.push(START_NODE_TYPE)
      return hidden
    },
    onDataChange: (workflow) => {
      if (syncingMethodKey.value || syncingInspector.value)
        return
      const plain = mergeIfNodeBranchEdgeMap(
        mergeWorkflowEdgeData(
          clonePlainWorkflow(workflow),
          workflowSnapshot.value
        ),
        workflowSnapshot.value
      )
      // 侧栏仅由标题栏「编辑」图标打开；画布单击选中节点不展开侧栏
      if (!plain.nodes?.some(n => n.selected))
        inspectorNodeId.value = null
      applyWorkflowRules(plain)
    }
  })
  requestAnimationFrame(() => {
    patchStartApiNodeDom(
      canvasRef.value ?? undefined,
      getWorkflowFromTinyflow(tinyflowRef.value!, workflowSnapshot.value)
    )
    setupToolbarVariablesWatch()
  })
}

onMounted(async () => {
  const data = await loadWorkflowData()
  initTinyflow(data)
})

onUnmounted(() => {
  runAbortController?.abort()
  runAbortController = null
  const canvas = canvasRef.value
  if (canvas?.getAttribute(CANVAS_TOOLBAR_PANEL_LISTENER_ATTR) === '1') {
    canvas.removeEventListener(FLOWGAME_OPEN_NODE_INSPECTOR_EVENT, onOpenNodeInspectorFromCanvas)
    canvas.removeEventListener(FLOWGAME_ASSIGN_BRANCH_EDGE_EVENT, onAssignBranchEdgeFromCanvas)
    canvas.removeEventListener(FLOWGAME_OPEN_FLOW_LIST_EVENT, onOpenFlowListPanel)
    canvas.removeEventListener(FLOWGAME_OPEN_FLOW_KNOWLEDGE_EVENT, onOpenFlowKnowledgePanel)
    canvas.removeAttribute(CANVAS_TOOLBAR_PANEL_LISTENER_ATTR)
  }
  cleanupNodeInspectorTrigger(canvasRef.value ?? undefined)
  toolbarVarsObserver?.disconnect()
  toolbarVarsObserver = null
  if (toolbarPatchRaf) {
    cancelAnimationFrame(toolbarPatchRaf)
    toolbarPatchRaf = 0
  }
  teardownInspectorHeightSync()
  varsToolbarMount.value = null
  tinyflowRef.value?.destroy()
  tinyflowRef.value = undefined
})

function beginTrialRun(workflow: ReturnType<typeof getWorkflowFromTinyflow>) {
  runState.phase = 'running'
  runState.plan = buildWorkflowRunPlan(workflow)
  runState.executions = []
  runState.summary = null
  runVisible.value = true
}

function upsertRunExecution(record: FlowNodeExecution) {
  const index = runState.executions.findIndex(item => item.nodeId === record.nodeId)
  if (index >= 0)
    runState.executions[index] = { ...runState.executions[index], ...record }
  else
    runState.executions.push(record)
}

function handleFlowStreamEvent(event: FlowStreamEventName, data: Record<string, unknown>) {
  if (event === 'node_started') {
    const row = parseStreamNodeStarted(data)
    if (row)
      upsertRunExecution(row)
    return
  }
  if (event === 'node_finished') {
    const row = parseStreamNodeFinished(data)
    if (row)
      upsertRunExecution(row)
    return
  }
  if (event === 'workflow_finished') {
    const finalExecutions = parseNodeExecutions(data)
    if (finalExecutions.length)
      runState.executions = finalExecutions
    runState.summary = parseFlowRunSummary(data)
    runState.phase = isFlowRunFailed(runState.summary) ? 'error' : 'success'
    return
  }
  if (event === 'workflow_error') {
    runState.phase = 'error'
    runState.summary = {
      message: typeof data.message === 'string' ? data.message : '工作流执行失败'
    }
  }
}

async function handleExecute() {
  if (!tinyflowRef.value) {
    Message.warning('编辑器未就绪')
    return
  }

  const workflow = applyWorkflowRules(
    getWorkflowFromTinyflow(tinyflowRef.value, workflowSnapshot.value),
    { silent: true }
  )
  if (!assertWorkflowRunnable(workflow))
    return

  runAbortController?.abort()
  runAbortController = new AbortController()
  const { signal } = runAbortController

  beginTrialRun(workflow)
  setLoading(true)
  try {
    await executeFlowGameStreamApi({ workflow }, {
      signal,
      onEvent: handleFlowStreamEvent
    })
    if (runState.phase === 'running') {
      runState.phase = 'error'
      runState.summary = { message: '流式连接已结束，未收到完成事件' }
      Message.warning(runState.summary.message)
    }
    else if (runState.phase === 'success') {
      Message.success('工作流执行成功')
      emit('executed', { phase: 'success' })
    }
    else if (runState.phase === 'error') {
      Message.warning(runState.summary?.message || '工作流执行异常')
      emit('executed', { phase: 'error' })
    }
  }
  catch (error) {
    if (signal.aborted)
      return
    runState.phase = 'error'
    const message = error instanceof Error ? error.message : '请求失败，请查看网络或服务日志'
    runState.summary = { message }
    Message.error(message)
  }
  finally {
    setLoading(false)
    if (runAbortController?.signal === signal)
      runAbortController = null
  }
}

function handleSave() {
  if (isViewMode.value) {
    Message.warning('查看模式下不可保存')
    return
  }
  if (!tinyflowRef.value) {
    Message.warning('编辑器未就绪')
    return
  }
  syncMethodKeyToCanvas()
  saveVisible.value = true
}

async function confirmSave() {
  const flowName = saveForm.flowName.trim()
  if (!flowName) {
    Message.warning('请输入流程名称')
    return false
  }
  if (!tinyflowRef.value)
    return false

  saveLoading.value = true
  try {
    const workflow = applyWorkflowRules(
      syncMethodKeyInWorkflow(
        getWorkflowFromTinyflow(tinyflowRef.value, workflowSnapshot.value),
        flowName
      ),
      { silent: true }
    )
    if (!assertWorkflowSaveValid(workflow))
      return false
    tinyflowRef.value.setData(workflow)
    await saveFlowWorkflowApi(flowName, workflow)
    Message.success('保存成功')
    emit('saved', { flowName })
    return true
  }
  catch {
    return false
  }
  finally {
    saveLoading.value = false
  }
}

defineExpose({
  openFlowFromListPanel,
  applyWorkflowToCanvas,
  reloadFromProps,
  getWorkflow: () => workflowSnapshot.value
})
</script>

<template>
  <div class="flowgram-page">
    <Spin :loading="pageLoading" class="flowgram-page__canvas-wrap">
      <div class="flowgram-page__canvas-area">
        <CanvasFloatingToolbar
          :tinyflow="tinyflowRef"
          :canvas="canvasRef"
          :editor-mode="editorFormMode"
          :flow-name="toolbarFlowName"
          :readonly="isViewMode"
          :run-loading="loading"
          :minimap-visible="minimapVisible"
          @run="handleExecute"
          @save="handleSave"
          @update:minimap-visible="onMinimapVisibleChange"
        />
        <div class="flowgram-page__canvas-shell">
          <div
            ref="canvasRef"
            class="flowgram-page__canvas"
            :class="{ 'flowgram-page__canvas--readonly': isViewMode }"
          />
          <aside v-if="selectedNode" class="flowgram-page__inspector" :style="inspectorPanelStyle">
            <NodeInspectorPanel
              :key="selectedNode.id"
              :node="selectedNode"
              :workflow="workflowSnapshot"
              :readonly="isViewMode"
              @patch-data="onInspectorPatchData"
              @patch-parameters="onInspectorPatchParameters"
              @patch-output-defs="onInspectorPatchOutputDefs"
              @patch-edge="patchEdgeFromInspector"
              @assign-branch-edge="assignBranchEdgeFromInspector"
            />
          </aside>
        </div>
        <Teleport v-if="varsToolbarMount" :to="varsToolbarMount">
          <VariableTreeContent :workflow="workflowSnapshot" />
        </Teleport>
      </div>
    </Spin>

    <FlowRunProgressModal
      v-model:visible="runVisible"
      :phase="runState.phase"
      :plan="runState.plan"
      :executions="runState.executions"
      :summary="runState.summary"
    />

    <FlowListPanelModal
      v-if="builtinBusinessModals"
      v-model:visible="flowListPanelVisible"
      :editor-readonly="props.readonly"
      @open="onOpenFlowFromListPanel"
    />

    <FlowKnowledgePanelModal
      v-if="builtinBusinessModals"
      v-model:visible="flowKnowledgePanelVisible"
    />

    <Modal
      v-model:visible="saveVisible"
      title="保存工作流"
      :ok-loading="saveLoading"
      @before-ok="confirmSave"
    >
      <Form :model="saveForm" layout="vertical">
        <FormItem
          label="流程名称"
          field="flowName"
          required
          :rules="[{ required: true, message: '请输入流程名称' }]"
        >
          <Input
            v-model="saveForm.flowName"
            :placeholder="saveFlowRedisKeyPlaceholder"
            allow-clear
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
