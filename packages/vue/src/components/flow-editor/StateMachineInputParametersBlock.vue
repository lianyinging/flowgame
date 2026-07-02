<script setup lang="ts">
import { computed } from 'vue'
import { Input, Popover, Select, TreeSelect } from '@arco-design/web-vue'
import { IconDelete, IconPlus } from '@arco-design/web-vue/es/icon'
import type { RefSelectTreeNode } from '@flowgame/core'
import {
  DEFAULT_STATE_MACHINE_MODE,
  REF_TYPE_OPTIONS,
  STATE_MACHINE_DEFAULT_PARAMS_TITLE,
  STATE_MACHINE_INPUT_SECTION_TITLE,
  STATE_MACHINE_MODE_SECTION_TITLE,
  STATE_MACHINE_MODES,
  mergeStateParametersForModeChange,
  isStateMachineBuiltinParam,
  newParameterId,
  partitionStateMachineParameters,
  readStateMachineMode,
  type FlowParameter,
  type StateMachineMode
} from '@flowgame/core'

const props = defineProps<{
  nodeData: Record<string, unknown>
  parameters: FlowParameter[]
  upstreamRefTree: RefSelectTreeNode[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  patchData: [patch: Record<string, unknown>]
  patchParameters: [parameters: FlowParameter[]]
  updateParam: [index: number, patch: Partial<FlowParameter>]
}>()

const mode = computed(() => readStateMachineMode(props.nodeData))

const refTypeOptions = REF_TYPE_OPTIONS.filter(o => o.value !== 'input')

const partitioned = computed(() =>
  partitionStateMachineParameters(props.parameters, mode.value)
)

const WRITE_UPDATE_ORDER = ['entityKey', 'status', 'progress', 'message', 'payload'] as const
const READ_DELETE_ORDER = ['entityKey'] as const

function orderDefaultRows(rows: Array<{ index: number, param: FlowParameter }>) {
  const order = mode.value === 'read' || mode.value === 'delete'
    ? READ_DELETE_ORDER
    : WRITE_UPDATE_ORDER
  const sorted: Array<{ index: number, param: FlowParameter }> = []
  for (const name of order) {
    const row = rows.find(r => r.param.name === name)
    if (row)
      sorted.push(row)
  }
  for (const row of rows) {
    if (!order.includes(row.param.name as typeof order[number]))
      sorted.push(row)
  }
  return sorted
}

const customRows = computed(() => partitioned.value.customRows)
const defaultRows = computed(() => orderDefaultRows(partitioned.value.defaultRows))

function onModeChange(next: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const value = String(next) as StateMachineMode
  emit('patchData', { mode: value })
  emit('patchParameters', mergeStateParametersForModeChange(props.parameters, value))
}

function isOptionalField(name: string) {
  if (mode.value === 'write')
    return name !== 'entityKey' && name !== 'status'
  if (mode.value === 'update')
    return name !== 'entityKey'
  return false
}

function addCustomParameter() {
  const used = new Set(
    props.parameters.map(p => (p.name || '').trim()).filter(Boolean)
  )
  let i = props.parameters.length + 1
  let name = `param${i}`
  while (used.has(name)) {
    i += 1
    name = `param${i}`
  }
  emit('patchParameters', [
    ...props.parameters,
    {
      id: newParameterId('state_in'),
      name,
      dataType: 'String',
      refType: 'ref',
      ref: ''
    }
  ])
}

function removeCustomParameter(index: number) {
  if (props.readonly)
    return
  const param = props.parameters[index]
  if (isStateMachineBuiltinParam(param?.name, mode.value))
    return
  const next = props.parameters.filter((_, i) => i !== index)
  emit('patchParameters', next)
}
</script>

<template>
  <div class="flowgame-state-inspector">
    <div class="heading">
      <h3 class="tf-node-panel__heading-text">
        {{ STATE_MACHINE_MODE_SECTION_TITLE }}
      </h3>
    </div>
    <div class="flowgame-state-inspector__mode">
      <Select
        :model-value="mode || DEFAULT_STATE_MACHINE_MODE"
        :options="STATE_MACHINE_MODES.map(m => ({ label: m.label, value: m.value }))"
        :disabled="readonly"
        @change="onModeChange"
      />
    </div>

    <div class="heading flowgame-state-inspector__section-heading">
      <h3 class="tf-node-panel__heading-text">
        {{ STATE_MACHINE_INPUT_SECTION_TITLE }}
      </h3>
      <button
        v-if="!readonly"
        type="button"
        class="input-btn-more tf-node-panel__add-btn"
        @click="addCustomParameter"
      >
        <IconPlus />
      </button>
    </div>

    <p v-if="!customRows.length" class="tf-node-panel__none-text flowgame-state-inspector__empty">
      无自定义入参；点击 + 添加，供 Key 模板 {{参数名}} 使用
    </p>

    <div
      v-else
      class="input-container tf-kb-input-container flowgame-state-params flowgame-state-params--custom"
    >
      <div class="input-header">
        参数名称
      </div>
      <div class="input-header">
        参数值
      </div>
      <div class="input-header" aria-hidden="true" />

      <template v-for="{ index, param } in customRows" :key="param.id ?? `custom-${index}`">
        <div class="input-item">
          <Input
            :model-value="param.name || ''"
            placeholder="参数名称"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { name: v })"
          />
        </div>
        <div class="input-item">
          <TreeSelect
            v-if="(param.refType || 'ref') === 'ref' && upstreamRefTree.length"
            :model-value="param.ref || undefined"
            :data="upstreamRefTree"
            :field-names="{ key: 'key', title: 'title', children: 'children' }"
            allow-search
            allow-clear
            placeholder="请选择上游变量"
            :disabled="readonly"
            @change="(v: string | undefined) => emit('updateParam', index, { ref: v ?? '' })"
          />
          <Input
            v-else-if="(param.refType || 'ref') === 'ref'"
            :model-value="param.ref || ''"
            placeholder="请输入引用路径"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { ref: v })"
          />
          <Input
            v-else-if="(param.refType || 'ref') === 'fixed'"
            :model-value="String(param.value ?? param.defaultValue ?? '')"
            placeholder="固定值"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { value: v })"
          />
          <Input
            v-else
            :model-value="String(param.value ?? '')"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { value: v })"
          />
        </div>
        <div class="input-item input-item--type">
          <Popover position="left">
            <span class="tf-param-type-trigger">{{ param.dataType || 'String' }}</span>
            <template #content>
              <div class="tf-param-type-pop">
                <div>引用方式</div>
                <Select
                  :model-value="param.refType || 'ref'"
                  :options="refTypeOptions"
                  size="mini"
                  :disabled="readonly"
                  @change="(v: string) => emit('updateParam', index, { refType: v })"
                />
              </div>
            </template>
          </Popover>
          <button
            v-if="!readonly"
            type="button"
            class="input-btn-more tf-node-panel__del-btn"
            @click="removeCustomParameter(index)"
          >
            <IconDelete />
          </button>
        </div>
      </template>
    </div>

    <div class="heading tf-node-panel__form-heading flowgame-state-inspector__sub-heading">
      <h3 class="tf-node-panel__heading-text">
        {{ STATE_MACHINE_DEFAULT_PARAMS_TITLE }}
      </h3>
    </div>

    <div class="input-container tf-kb-input-container flowgame-state-params flowgame-state-params--default">
      <div class="input-header">
        参数名称
      </div>
      <div class="input-header">
        参数值
      </div>
      <div class="input-header" aria-hidden="true" />

      <template v-for="{ index, param } in defaultRows" :key="param.id ?? `default-${index}`">
        <div class="input-item">
          <span class="tf-param-name-label">
            {{ param.name || '' }}
            <span v-if="isOptionalField(param.name || '')" class="flowgame-state-optional">（可选）</span>
          </span>
        </div>
        <div class="input-item">
          <TreeSelect
            v-if="(param.refType || 'ref') === 'ref' && upstreamRefTree.length"
            :model-value="param.ref || undefined"
            :data="upstreamRefTree"
            :field-names="{ key: 'key', title: 'title', children: 'children' }"
            allow-search
            allow-clear
            placeholder="请选择上游变量"
            :disabled="readonly"
            @change="(v: string | undefined) => emit('updateParam', index, { ref: v ?? '' })"
          />
          <Input
            v-else-if="(param.refType || 'ref') === 'ref'"
            :model-value="param.ref || ''"
            placeholder="请输入引用路径"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { ref: v })"
          />
          <Input
            v-else-if="(param.refType || 'ref') === 'fixed'"
            :model-value="String(param.value ?? param.defaultValue ?? '')"
            :placeholder="param.dataType === 'Number' ? '数字' : '固定值'"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { value: v })"
          />
          <Input
            v-else
            :model-value="String(param.value ?? '')"
            :disabled="readonly"
            @input="v => emit('updateParam', index, { value: v })"
          />
        </div>
        <div class="input-item input-item--type">
          <Popover position="left">
            <span class="tf-param-type-trigger">{{ param.dataType || 'String' }}</span>
            <template #content>
              <div class="tf-param-type-pop">
                <div>引用方式</div>
                <Select
                  :model-value="param.refType || 'ref'"
                  :options="refTypeOptions"
                  size="mini"
                  :disabled="readonly"
                  @change="(v: string) => emit('updateParam', index, { refType: v })"
                />
              </div>
            </template>
          </Popover>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.flowgame-state-inspector__mode {
  margin-bottom: 16px;
}

.flowgame-state-inspector__mode :deep(.arco-select) {
  width: 100%;
}

.flowgame-state-inspector__section-heading {
  margin-top: 4px;
}

.flowgame-state-inspector__sub-heading {
  margin-top: 16px;
  margin-bottom: 8px;
}

.flowgame-state-inspector__sub-heading .tf-node-panel__heading-text {
  font-size: 13px;
  font-weight: 500;
}

.flowgame-state-inspector__empty {
  margin: 0 0 8px;
}

.flowgame-state-params--custom {
  margin-bottom: 4px;
}

.flowgame-state-optional {
  font-size: 11px;
  color: var(--color-text-3, #c9cdd4);
  font-weight: normal;
}

.input-item--type {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
