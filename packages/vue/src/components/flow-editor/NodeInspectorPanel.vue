<script setup lang="ts">
import type { CustomNodeForm } from '@tinyflow-ai/ui'
import { computed, ref, watch } from 'vue'
import type { TinyflowData } from '@tinyflow-ai/ui'
import { Empty, Input, Select, Textarea, TreeSelect } from '@arco-design/web-vue'
import {
  addChildOutputDefAt,
  buildKbBaseSelectOptions,
  buildKnowledgeBasePatch,
  buildKnowledgeKeywordPatch,
  buildKnowledgeLimitPatch,
  buildUpstreamRefSelectTree,
  cloneParameters,
  DEFAULT_HTML_TEMPLATE,
  defaultMemoryWriteParameters,
  HTML_TEMPLATE_NODE_TYPE,
  MEMORY_READ_NODE_TYPE,
  MEMORY_WRITE_NODE_TYPE,
  memoryReadNodeOutputDefs,
  memoryWriteNodeOutputDefs,
  parseMemoryWriteGroups,
  CODE_NODE_CODE_PLACEHOLDER,
  CODE_NODE_ENGINE_OPTIONS,
  createKnowledgeNodeDefaultOutputDefs,
  getCustomNodeDef,
  getInspectorForms,
  getNodeIconHtml,
  getNodeTypeLabel,
  isCodeNodeType,
  isInspectorOutputDefsEnabled,
  isInspectorParametersEnabled,
  isKnowledgeNodeType,
  knowledgeNodeDefaultParameters,
  listKbBasesCached,
  newParameterId,
  PARAMETER_DATA_TYPES,
  readCodeNodeCode,
  readCodeNodeEngine,
  readKnowledgeBaseFromData,
  REF_TYPE_OPTIONS,
  removeOutputDefAt,
  updateOutputDefAt,
  type FlowParameter,
  type InspectorFlowNode
} from '@flowgame/core'
import KnowledgeBasePickerBlock from './KnowledgeBasePickerBlock.vue'
import KnowledgeInputParametersBlock from './KnowledgeInputParametersBlock.vue'
import MemoryReadInputParametersBlock from './MemoryReadInputParametersBlock.vue'
import MemoryWriteGroupsBlock from './MemoryWriteGroupsBlock.vue'
import HtmlTemplateInputParametersBlock from './HtmlTemplateInputParametersBlock.vue'
import HtmlTemplateEditorWithPreview from './HtmlTemplateEditorWithPreview.vue'
import OutputDefInspectorRow from './OutputDefInspectorRow.vue'
import { IconDelete, IconPlus } from '@arco-design/web-vue/es/icon'

const props = defineProps<{
  node: InspectorFlowNode | null
  workflow?: TinyflowData
  readonly?: boolean
}>()

const emit = defineEmits<{
  patchData: [payload: { nodeId: string, data: Record<string, unknown> }]
  patchParameters: [payload: { nodeId: string, parameters: FlowParameter[] }]
  patchOutputDefs: [payload: { nodeId: string, outputDefs: FlowParameter[] }]
}>()

const nodeData = computed(() => (props.node?.data ?? {}) as Record<string, unknown>)
const nodeType = computed(() => props.node?.type as string | undefined)
const formSections = computed(() => getInspectorForms(nodeType.value))
const customDef = computed(() => getCustomNodeDef(nodeType.value))
const parameters = computed(() => cloneParameters(nodeData.value.parameters as FlowParameter[] | undefined))
const outputDefs = computed(() => cloneParameters(nodeData.value.outputDefs as FlowParameter[] | undefined))

const showInputSection = computed(() => isInspectorParametersEnabled(nodeType.value))
const showOutputSection = computed(() => isInspectorOutputDefsEnabled(nodeType.value))
/** 结束节点输出需映射上游变量，与画布「参数名称 | 参数值」一致 */
const showOutputValueColumn = computed(() => nodeType.value === 'endNode')
const isKnowledgeNode = computed(() => isKnowledgeNodeType(nodeType.value))
const isCodeNode = computed(() => isCodeNodeType(nodeType.value))
const isMemoryWriteNode = computed(() => nodeType.value === MEMORY_WRITE_NODE_TYPE)
const isMemoryReadNode = computed(() => nodeType.value === MEMORY_READ_NODE_TYPE)
const isHtmlTemplateNode = computed(() => nodeType.value === HTML_TEMPLATE_NODE_TYPE)
const htmlTemplateText = computed(() => {
  const tpl = nodeData.value.template
  if (typeof tpl === 'string' && tpl.trim())
    return tpl
  return DEFAULT_HTML_TEMPLATE
})
const inspectorFormSections = computed(() =>
  isHtmlTemplateNode.value ? [] : formSections.value
)
const codeEngine = computed(() => readCodeNodeEngine(nodeData.value))
const codeText = computed(() => readCodeNodeCode(nodeData.value))

const kbOptionsLoading = ref(false)
const kbOptions = ref<Array<{ label: string, value: string }>>([])

const knowledgeBaseValue = computed(() => readKnowledgeBaseFromData(nodeData.value))

async function loadKbOptions() {
  kbOptionsLoading.value = true
  try {
    const bases = await listKbBasesCached()
    const selected = readKnowledgeBaseFromData(nodeData.value)
    kbOptions.value = bases.length
      ? buildKbBaseSelectOptions(bases, selected)
      : [{ label: '请先在「知识库配置」创建知识库', value: '' }]
  }
  catch {
    kbOptions.value = [{ label: '加载知识库列表失败', value: '' }]
  }
  finally {
    kbOptionsLoading.value = false
  }
}

function cloneParamTemplate(param: FlowParameter): FlowParameter {
  return JSON.parse(JSON.stringify(param)) as FlowParameter
}

/** 侧栏打开时补齐与画布一致的 keyword/limit、输出定义（无需整图 setData） */
function ensureKnowledgeInspectorDefaults() {
  if (!props.node?.id || props.readonly || !isKnowledgeNode.value)
    return

  const rawParams = cloneParameters(nodeData.value.parameters as FlowParameter[] | undefined)
  const paramNames = new Set(rawParams.map(p => p.name))
  let nextParams = rawParams
  let paramsDirty = false
  for (const template of knowledgeNodeDefaultParameters) {
    if (!paramNames.has(template.name!)) {
      nextParams = [...nextParams, cloneParamTemplate(template)]
      paramsDirty = true
    }
  }

  const rawOutputs = cloneParameters(nodeData.value.outputDefs as FlowParameter[] | undefined)
  let nextOutputs = rawOutputs
  let outputsDirty = false
  if (!rawOutputs.length) {
    nextOutputs = createKnowledgeNodeDefaultOutputDefs().map(cloneParamTemplate)
    outputsDirty = true
  }
  else if (!rawOutputs.some(p => p.name === 'documents')) {
    nextOutputs = [
      ...rawOutputs,
      ...createKnowledgeNodeDefaultOutputDefs()
        .filter(d => !rawOutputs.some(p => p.name === d.name))
        .map(cloneParamTemplate)
    ]
    outputsDirty = true
  }

  if (paramsDirty)
    patchParameters(nextParams)

  const merged = paramsDirty ? nextParams : rawParams
  const legacyKw = String(nodeData.value.keyword ?? '').trim()
  const kwIdx = merged.findIndex(p => p.name === 'keyword')
  if (legacyKw && kwIdx >= 0) {
    const kw = merged[kwIdx]
    if (kw.refType === 'ref' && !String(kw.ref ?? '').trim()) {
      const synced = [...merged]
      synced[kwIdx] = { ...kw, ref: legacyKw }
      patchParameters(synced)
    }
    else if (kw.refType === 'fixed' && !String(kw.value ?? '').trim()) {
      const synced = [...merged]
      synced[kwIdx] = { ...kw, refType: 'fixed', value: legacyKw, ref: '' }
      patchParameters(synced)
    }
  }

  if (outputsDirty)
    patchOutputDefs(nextOutputs)
}

watch(
  () => [props.node?.id, isKnowledgeNode.value] as const,
  ([id, isKb]) => {
    if (id && isKb) {
      void loadKbOptions()
      ensureKnowledgeInspectorDefaults()
    }
  },
  { immediate: true }
)

function ensureMemoryNodeInspectorDefaults() {
  if (!props.node?.id || props.readonly)
    return
  if (isMemoryWriteNode.value) {
    if (!parseMemoryWriteGroups(parameters.value).length)
      patchParameters(defaultMemoryWriteParameters())
    if (!outputDefs.value.length) {
      patchOutputDefs(
        cloneParameters(memoryWriteNodeOutputDefs).map(p => ({
          ...p,
          id: p.id ?? newParameterId('out')
        }))
      )
    }
    return
  }
  if (isMemoryReadNode.value && !outputDefs.value.length) {
    patchOutputDefs(
      cloneParameters(memoryReadNodeOutputDefs).map(p => ({
        ...p,
        id: p.id ?? newParameterId('out')
      }))
    )
  }
}

watch(
  () => [props.node?.id, isMemoryWriteNode.value, isMemoryReadNode.value] as const,
  () => {
    ensureMemoryNodeInspectorDefaults()
  },
  { immediate: true }
)

function onKnowledgeBaseChange(value: string | undefined) {
  patchData(buildKnowledgeBasePatch(value ?? ''))
}

const upstreamRefTree = computed(() => {
  if (!props.node?.id)
    return []
  return buildUpstreamRefSelectTree(props.workflow ?? {}, props.node.id)
})

const allowAddInput = computed(() => {
  if (props.readonly)
    return false
  if (isKnowledgeNode.value || isMemoryWriteNode.value)
    return false
  if (!customDef.value)
    return true
  return customDef.value.parametersAddEnable !== false
})

const allowAddOutput = computed(() => {
  if (props.readonly)
    return false
  if (!customDef.value)
    return true
  return customDef.value.outputDefsAddEnable !== false
})

const methodKeyText = computed(() => {
  const v = String(nodeData.value.methodKey ?? '').trim()
  return v || '（请先填写流程名称）'
})

/** 画布节点卡片标题（data.title），无则用节点类型中文名 */
const selectedNodeTitle = computed(() => {
  const title = String(nodeData.value.title ?? '').trim()
  if (title)
    return title
  if (customDef.value?.title)
    return customDef.value.title
  return getNodeTypeLabel(nodeType.value)
})

const selectedNodeTypeSubtitle = computed(() => {
  const title = String(nodeData.value.title ?? '').trim()
  const typeLabel = getNodeTypeLabel(nodeType.value)
  if (!title || title === typeLabel)
    return ''
  return typeLabel
})

const selectedNodeIconHtml = computed(() => getNodeIconHtml(nodeType.value))

function patchData(patch: Record<string, unknown>) {
  if (!props.node?.id || props.readonly)
    return
  emit('patchData', {
    nodeId: props.node.id,
    data: { ...nodeData.value, ...patch }
  })
}

function patchField(name: string, value: unknown) {
  patchData({ [name]: value })
}

function patchParameters(next: FlowParameter[]) {
  if (!props.node?.id || props.readonly)
    return
  emit('patchParameters', { nodeId: props.node.id, parameters: next })
}

function patchOutputDefs(next: FlowParameter[]) {
  if (!props.node?.id || props.readonly)
    return
  emit('patchOutputDefs', { nodeId: props.node.id, outputDefs: next })
}

function updateParameter(index: number, patch: Partial<FlowParameter>) {
  const next = cloneParameters(parameters.value)
  next[index] = { ...next[index], ...patch }
  patchParameters(next)
}

/** 与画布节点内输入参数一致，并同步 data.keyword / data.limit */
function updateKnowledgeParameter(index: number, patch: Partial<FlowParameter>) {
  if (!props.node?.id || props.readonly)
    return
  const next = cloneParameters(parameters.value)
  next[index] = { ...next[index], ...patch }
  const name = next[index].name
  let data = { ...nodeData.value }
  if (name === 'keyword') {
    const synced = buildKnowledgeKeywordPatch(data, next, {
      refType: next[index].refType,
      ref: next[index].ref,
      fixedValue: next[index].value
    })
    data = synced.data
    emit('patchParameters', { nodeId: props.node.id, parameters: synced.parameters })
    emit('patchData', { nodeId: props.node.id, data })
    return
  }
  if (name === 'limit') {
    const synced = buildKnowledgeLimitPatch(
      data,
      next,
      String(next[index].value ?? next[index].defaultValue ?? '10')
    )
    data = synced.data
    emit('patchParameters', { nodeId: props.node.id, parameters: synced.parameters })
    emit('patchData', { nodeId: props.node.id, data })
    return
  }
  patchParameters(next)
}

function addParameter() {
  patchParameters([
    ...parameters.value,
    {
      id: newParameterId('in'),
      name: 'param',
      dataType: 'String',
      refType: 'ref',
      ref: ''
    }
  ])
}

function addHtmlTemplateParameter() {
  const used = new Set(
    parameters.value.map(p => (p.name || '').trim()).filter(Boolean)
  )
  let i = parameters.value.length + 1
  let name = `param${i}`
  while (used.has(name)) {
    i += 1
    name = `param${i}`
  }
  patchParameters([
    ...parameters.value,
    {
      id: newParameterId('html_in'),
      name,
      dataType: 'String',
      refType: 'ref',
      ref: '',
      description: `模板占位符 {{ ${name} }} 将替换为引用或固定值`
    }
  ])
}

function removeParameter(index: number) {
  const next = cloneParameters(parameters.value)
  next.splice(index, 1)
  patchParameters(next)
}

function addOutputDef() {
  patchOutputDefs([
    ...outputDefs.value,
    {
      id: newParameterId('out'),
      name: 'output',
      dataType: 'String',
      ...(showOutputValueColumn.value
        ? { refType: 'ref' as const, ref: '' }
        : {})
    }
  ])
}

function onOutputDefUpdate(path: number[], patch: Partial<FlowParameter>) {
  patchOutputDefs(updateOutputDefAt(outputDefs.value, path, patch))
}

function onOutputDefRemove(path: number[]) {
  patchOutputDefs(removeOutputDefAt(outputDefs.value, path))
}

function onOutputDefAddChild(path: number[]) {
  patchOutputDefs(addChildOutputDefAt(outputDefs.value, path))
}

function fieldComponent(field: CustomNodeForm) {
  if (field.type === 'textarea')
    return 'textarea'
  if (field.type === 'select')
    return 'select'
  if (field.type === 'slider')
    return 'slider'
  return 'input'
}

function showMethodKeyAfterHeading(field: CustomNodeForm) {
  return nodeType.value === 'node_start_api' && field.type === 'heading' && field.label === 'API 接口配置'
}

/** Arco Input 的 change 仅在失焦时触发，编辑需用 input；Textarea 的 input 会先 emit 再更新，拿到的是旧值，需用 update:model-value */
function onTextInput(handler: (value: string) => void) {
  return (value: string) => handler(value)
}
</script>

<template>
  <div class="flowgram-inspector tf-node-panel">
    <Empty v-if="!node" description="点击画布中的节点以查看和编辑配置" />

    <template v-else>
      <header class="tf-node-panel__header">
        <div
          v-if="selectedNodeIconHtml"
          class="tf-node-panel__node-icon"
          aria-hidden="true"
          v-html="selectedNodeIconHtml"
        />
        <div class="tf-node-panel__header-text">
          <h2 class="tf-node-panel__node-title">
            {{ selectedNodeTitle }}
          </h2>
          <p v-if="selectedNodeTypeSubtitle" class="tf-node-panel__node-type">
            {{ selectedNodeTypeSubtitle }}
          </p>
        </div>
      </header>

      <div class="flowgram-inspector__body">
      <!-- 1. 输入参数 -->
      <section v-if="showInputSection && isKnowledgeNode" class="tf-node-panel__block">
        <div class="heading">
          <h3 class="tf-node-panel__heading-text">
            输入参数
          </h3>
        </div>
        <p v-if="!parameters.length" class="tf-node-panel__none-text">
          无输入参数
        </p>
        <KnowledgeInputParametersBlock
          v-else
          :parameters="parameters"
          :upstream-ref-tree="upstreamRefTree"
          :readonly="readonly"
          @update="updateKnowledgeParameter"
        />
      </section>

      <section
        v-else-if="showInputSection && isMemoryWriteNode"
        class="tf-node-panel__block"
      >
        <div class="heading">
          <h3 class="tf-node-panel__heading-text">
            输入参数
          </h3>
        </div>
        <MemoryWriteGroupsBlock
          :parameters="parameters"
          :upstream-ref-tree="upstreamRefTree"
          :readonly="readonly"
          @replace="patchParameters"
        />
      </section>

      <section
        v-else-if="showInputSection && isMemoryReadNode"
        class="tf-node-panel__block"
      >
        <div class="heading">
          <h3 class="tf-node-panel__heading-text">
            输入参数
          </h3>
        </div>
        <p v-if="!parameters.length" class="tf-node-panel__none-text">
          无输入参数
        </p>
        <MemoryReadInputParametersBlock
          v-else
          :parameters="parameters"
          :upstream-ref-tree="upstreamRefTree"
          :readonly="readonly"
          @update="updateParameter"
        />
      </section>

      <section
        v-else-if="showInputSection && isHtmlTemplateNode"
        class="tf-node-panel__block"
      >
        <div class="heading">
          <h3 class="tf-node-panel__heading-text">
            输入参数
          </h3>
          <button
            v-if="allowAddInput"
            type="button"
            class="input-btn-more tf-node-panel__add-btn"
            :disabled="readonly"
            @click="addHtmlTemplateParameter"
          >
            <IconPlus />
          </button>
        </div>
        <p v-if="!parameters.length" class="tf-node-panel__none-text">
          无输入参数
        </p>
        <template v-else>
          <p class="tf-node-panel__field-desc">
            参数名称对应模板中的 <code v-pre>{{ 参数名称 }}</code>；值类型为「引用」时从上游节点选择变量（与画布一致）
          </p>
          <HtmlTemplateInputParametersBlock
            :parameters="parameters"
            :upstream-ref-tree="upstreamRefTree"
            :readonly="readonly"
            @update="updateParameter"
            @remove="removeParameter"
          />
        </template>
      </section>

      <section v-else-if="showInputSection" class="tf-node-panel__block">
        <div class="heading">
          <h3 class="tf-node-panel__heading-text">
            输入参数
          </h3>
          <button
            v-if="allowAddInput"
            type="button"
            class="input-btn-more tf-node-panel__add-btn"
            :disabled="readonly"
            @click="addParameter"
          >
            <IconPlus />
          </button>
        </div>

        <p v-if="!parameters.length" class="tf-node-panel__none-text">
          无输入参数
        </p>
        <p v-else class="tf-node-panel__field-desc">
          值类型为「引用」时，从上游节点输出中选择变量（与节点内下拉一致）
        </p>

        <div
          v-for="(param, index) in parameters"
          :key="param.id || `in-${index}`"
          class="tf-param-row nodrag"
        >
          <div class="input-item">
            <Input
              :model-value="param.name || ''"
              placeholder="请输入参数"
              :disabled="readonly || param.nameDisabled === true"
              @input="onTextInput(v => updateParameter(index, { name: v }))"
            />
          </div>
          <div class="input-item tf-param-row__value">
            <TreeSelect
              v-if="(param.refType || 'ref') === 'ref' && upstreamRefTree.length"
              :model-value="param.ref || undefined"
              :data="upstreamRefTree"
              :field-names="{ key: 'key', title: 'title', children: 'children' }"
              :disabled="readonly"
              allow-search
              allow-clear
              placeholder="选择上游输出变量"
              style="width: 100%"
              @change="(v: string | undefined) => updateParameter(index, { ref: v ?? '' })"
            />
            <Input
              v-else-if="(param.refType || 'ref') === 'ref'"
              :model-value="param.ref || ''"
              placeholder="无上游节点时可手填，如 node_xxx.output"
              :disabled="readonly"
              @input="onTextInput(v => updateParameter(index, { ref: v }))"
            />
            <Input
              v-else-if="(param.refType || 'ref') === 'fixed'"
              :model-value="String(param.value ?? '')"
              placeholder="请输入固定值"
              :disabled="readonly"
              @input="onTextInput(v => updateParameter(index, { value: v }))"
            />
            <Input
              v-else
              model-value="在执行期间，由用户输入"
              disabled
            />
          </div>
          <div class="input-item tf-param-row__actions">
            <Select
              :model-value="param.refType || 'ref'"
              size="small"
              :disabled="readonly"
              @change="(v: string) => updateParameter(index, { refType: v })"
            >
              <Select.Option
                v-for="opt in REF_TYPE_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </Select.Option>
            </Select>
            <button
              v-if="!readonly && param.deleteDisabled !== true"
              type="button"
              class="input-btn-more tf-node-panel__del-btn"
              @click="removeParameter(index)"
            >
              <IconDelete />
            </button>
          </div>
          <p v-if="param.description" class="tf-node-panel__param-desc">
            {{ param.description }}
          </p>
        </div>
      </section>

      <!-- 知识库设置：仅选择知识库（keyword / limit 见上方输入参数） -->
      <section v-if="isKnowledgeNode" class="tf-node-panel__block">
        <div class="heading tf-node-panel__form-heading">
          <h3 class="tf-node-panel__heading-text">
            知识库设置
          </h3>
        </div>
        <KnowledgeBasePickerBlock>
          <Select
            :model-value="knowledgeBaseValue || undefined"
            :options="kbOptions"
            placeholder="请选择知识库"
            allow-search
            allow-clear
            :loading="kbOptionsLoading"
            :disabled="readonly"
            @change="onKnowledgeBaseChange"
          />
        </KnowledgeBasePickerBlock>
      </section>

      <section v-if="isHtmlTemplateNode" class="tf-node-panel__block">
        <div class="heading tf-node-panel__form-heading">
          <h3 class="tf-node-panel__heading-text">
            HTML 模板
          </h3>
        </div>
        <HtmlTemplateEditorWithPreview
          :model-value="htmlTemplateText"
          :parameters="parameters"
          variant="inspector"
          :readonly="readonly"
          @update:model-value="(v: string) => patchField('template', v ?? '')"
        />
      </section>

      <!-- 动态代码：执行引擎与执行代码（与画布 codeNode 一致） -->
      <section v-if="isCodeNode" class="tf-node-panel__block">
        <div class="heading tf-node-panel__form-heading">
          <h3 class="tf-node-panel__heading-text">
            代码
          </h3>
        </div>
        <div class="setting-title">
          执行引擎
        </div>
        <div class="setting-item">
          <Select
            :model-value="codeEngine"
            placeholder="请选择执行引擎"
            :disabled="readonly"
            @change="(v: string) => patchField('engine', v)"
          >
            <Select.Option
              v-for="opt in CODE_NODE_ENGINE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </Select.Option>
          </Select>
        </div>
        <div class="setting-title">
          执行代码
        </div>
        <div class="setting-item tf-code-node__code-item">
          <Textarea
            :model-value="codeText"
            :placeholder="CODE_NODE_CODE_PLACEHOLDER"
            :auto-size="{ minRows: 10, maxRows: 20 }"
            :disabled="readonly"
            @update:model-value="(v: string) => patchField('code', v ?? '')"
          />
        </div>
      </section>

      <!-- 2. 节点配置（forms：heading + setting-title / setting-item） -->
      <section v-if="inspectorFormSections.length" class="tf-node-panel__block">
        <template v-for="(field, index) in inspectorFormSections" :key="`${field.type}-${field.name || field.label}-${index}`">
          <div v-if="field.type === 'heading'" class="heading tf-node-panel__form-heading">
            <h3 class="tf-node-panel__heading-text">
              {{ field.label }}
            </h3>
          </div>

          <template v-else>
            <div class="setting-title">
              {{ field.label }}
            </div>
            <div class="setting-item">
              <Select
                v-if="fieldComponent(field) === 'select'"
                :model-value="nodeData[field.name] ?? field.defaultValue"
                :placeholder="field.placeholder"
                allow-clear
                :disabled="readonly"
                @change="onTextInput(v => patchField(field.name, v))"
              >
                <Select.Option
                  v-for="opt in field.options"
                  :key="String(opt.value)"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </Select.Option>
              </Select>
              <Textarea
                v-else-if="fieldComponent(field) === 'textarea'"
                :model-value="String(nodeData[field.name] ?? field.defaultValue ?? '')"
                :placeholder="field.placeholder"
                :auto-size="{ minRows: 3, maxRows: 8 }"
                :disabled="readonly"
                @update:model-value="(v: string) => patchField(field.name, v ?? '')"
              />
            <div v-else-if="fieldComponent(field) === 'slider'" class="slider-container">
                <span>
                  <span>{{ field.description || field.label }}</span>
                  <span>{{ nodeData[field.name] ?? field.defaultValue ?? '' }}</span>
                </span>
                <input
                  type="range"
                  class="nodrag"
                  :min="field.attrs?.min ?? 0"
                  :max="field.attrs?.max ?? 1"
                  :step="field.attrs?.step ?? 0.1"
                  :value="Number(nodeData[field.name] ?? field.defaultValue ?? 0)"
                  :disabled="readonly"
                  @input="(e) => patchField(field.name, Number((e.target as HTMLInputElement).value))"
                >
              </div>
              <Input
                v-else
                :model-value="String(nodeData[field.name] ?? field.defaultValue ?? '')"
                :placeholder="field.placeholder"
                :type="field.attrs?.type === 'password' ? 'password' : 'text'"
                allow-clear
                :disabled="readonly"
                @input="onTextInput(v => patchField(field.name, v))"
              />
            </div>
            <p v-if="field.description && fieldComponent(field) !== 'slider'" class="tf-node-panel__field-desc">
              {{ field.description }}
            </p>
          </template>

          <div
            v-if="showMethodKeyAfterHeading(field)"
            class="setting-item flowgame-method-key-display-wrap"
          >
            <div class="flowgame-method-key-display">
              {{ methodKeyText }}
            </div>
          </div>
          <p
            v-if="showMethodKeyAfterHeading(field)"
            class="flowgame-method-key-hint"
          >
            外部调用 /siyu/flowGame/execute 时传此字段
          </p>
        </template>
      </section>

      <!-- 3. 输出参数 -->
      <section v-if="showOutputSection" class="tf-node-panel__block">
        <div class="heading">
          <h3 class="tf-node-panel__heading-text">
            输出参数
          </h3>
          <button
            v-if="allowAddOutput"
            type="button"
            class="input-btn-more tf-node-panel__add-btn"
            :disabled="readonly"
            @click="addOutputDef"
          >
            <IconPlus />
          </button>
        </div>

        <p v-if="!outputDefs.length" class="tf-node-panel__none-text">
          无输出参数
        </p>

        <div
          v-else
          class="tf-output-params"
          :class="{ 'tf-output-params--with-value': showOutputValueColumn }"
        >
          <div class="tf-output-params__head">
            <span class="tf-output-params__col-name">参数名称</span>
            <span v-if="showOutputValueColumn" class="tf-output-params__col-value">参数值</span>
            <span class="tf-output-params__col-type">参数类型</span>
            <span class="tf-output-params__col-actions" aria-hidden="true" />
          </div>
          <p v-if="showOutputValueColumn" class="tf-node-panel__field-desc">
            选择上游节点输出作为流程结束时的返回值（与画布节点内配置一致）
          </p>
          <OutputDefInspectorRow
            v-for="(out, index) in outputDefs"
            :key="out.id || `out-${index}`"
            :param="out"
            :path="[index]"
            :readonly="readonly"
            :show-value-column="showOutputValueColumn"
            :upstream-ref-tree="upstreamRefTree"
            @update="onOutputDefUpdate"
            @remove="onOutputDefRemove"
            @add-child="onOutputDefAddChild"
          />
        </div>
      </section>

      <p
        v-if="!showInputSection && !inspectorFormSections.length && !showOutputSection && !isKnowledgeNode && !isMemoryWriteNode && !isMemoryReadNode && !isHtmlTemplateNode && !isCodeNode"
        class="tf-node-panel__none-text"
      >
        {{ getNodeTypeLabel(nodeType) }}：请在画布节点内展开配置（内置节点表单项与画布一致）。
      </p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.flowgram-inspector.tf-node-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  padding: 0;
  background: var(--tf-background, var(--color-bg-1));
  font-size: 13px;
  color: var(--tf-foreground, var(--color-text-1));

  .tf-node-panel__header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0;
    padding: 10px;
    border-bottom: 1px solid var(--tf-border, var(--color-border-2));
    background: var(--tf-background, var(--color-bg-1));
  }

  .flowgram-inspector__body {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 8px 10px 10px;
  }

  .tf-node-panel__node-icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    border-radius: 6px;
    background: var(--tf-muted, var(--color-fill-2));
    color: var(--tf-primary, rgb(var(--primary-6)));
    line-height: 0;

    :deep(svg) {
      width: 18px;
      height: 18px;
      display: block;
      flex-shrink: 0;
    }
  }

  .tf-node-panel__header-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .tf-node-panel__node-title {
    margin: 0;
    padding: 0;
    font-size: 15px;
    font-weight: 600;
    line-height: 28px;
    color: var(--tf-foreground, var(--color-text-1));
    word-break: break-word;
  }

  .tf-node-panel__header:has(.tf-node-panel__node-type) {
    align-items: flex-start;

    .tf-node-panel__node-icon {
      margin-top: 2px;
    }

    .tf-node-panel__node-title {
      line-height: 1.35;
    }
  }

  .tf-node-panel__node-type {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--tf-muted-foreground, var(--color-text-3));
  }

  .heading {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 6px;
  }

  .tf-node-panel__heading-text {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    flex: 1;
    min-width: 0;
  }

  .setting-title {
    font-size: 12px;
    color: var(--tf-secondary-foreground, var(--color-text-3));
    margin-bottom: 4px;
    margin-top: 10px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 10px;
    width: 100%;

    :deep(.arco-input-wrapper),
    :deep(.arco-textarea-wrapper),
    :deep(.arco-select) {
      width: 100%;
    }
  }

  .tf-code-node__code-item {
    align-items: stretch;

    :deep(.arco-textarea-wrapper) {
      width: 100%;
    }
  }

  .slider-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;

    > span {
      font-size: 12px;
      color: var(--tf-muted-foreground, var(--color-text-3));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    input[type='range'] {
      width: 100%;
      height: 4px;
      background: var(--tf-muted, var(--color-fill-3));
      border-radius: 2px;
      outline: none;
      appearance: none;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        background: var(--tf-primary, rgb(var(--primary-6)));
        border-radius: 50%;
        cursor: pointer;
      }
    }
  }

  .tf-param-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .input-item {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  .tf-param-row__value {
    flex: 1.4;
    min-width: 0;
  }

  .tf-param-row__actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 120px;
  }

  .input-btn-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    padding: 3px;
    border-radius: 4px;
    background: transparent;
    color: var(--tf-foreground, var(--color-text-2));
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--tf-input, var(--color-fill-2));
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .tf-output-params {
    &__head,
    :deep(.tf-output-param-row) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
    }

    &--with-value {
      .tf-output-params__head,
      :deep(.tf-output-param-row) {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr) minmax(0, 0.85fr) auto;
      }
    }

    &__head {
      margin-bottom: 6px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--tf-muted-foreground, var(--color-text-3));
    }

    &__col-actions {
      width: 32px;
    }

    :deep(.tf-output-param-row) {
      margin-bottom: 8px;
    }

    :deep(.tf-output-param-cell--type) {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;

      .arco-select {
        flex: 1;
        min-width: 0;
      }
    }

    :deep(.tf-output-param-cell--actions) {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    :deep(.arco-input-wrapper),
    :deep(.arco-select-view-single) {
      border-radius: 8px;
    }
  }

  .tf-node-panel__block + .tf-node-panel__block {
    margin-top: 4px;
  }

  .tf-node-panel__none-text,
  .tf-node-panel__field-desc,
  .tf-node-panel__param-desc {
    margin: 0 0 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--tf-muted-foreground, var(--color-text-3));
  }

  .tf-node-panel__param-desc {
    margin-top: 4px;
  }

  .flowgame-method-key-display {
    width: 100%;
    min-height: 32px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 20px;
    border-radius: 4px;
    border: 1px solid var(--tf-border, var(--color-border-2));
    background: var(--tf-muted, var(--color-fill-2));
    color: var(--tf-muted-foreground, var(--color-text-3));
    word-break: break-all;
    user-select: text;
  }

  .flowgame-method-key-hint {
    margin: -4px 0 10px;
    font-size: 12px;
    color: var(--tf-muted-foreground, var(--color-text-3));
  }
}
</style>
