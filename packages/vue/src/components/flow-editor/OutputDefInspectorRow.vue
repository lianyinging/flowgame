<script setup lang="ts">
import { computed } from 'vue'
import { Button, Input, Popover, Select, Textarea, TreeSelect } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import type { RefSelectTreeNode, FlowParameter } from '@flowgame/core'
import { PARAMETER_DATA_TYPES, REF_TYPE_OPTIONS } from '@flowgame/core'

const props = defineProps<{
  param: FlowParameter
  path: number[]
  depth?: number
  readonly?: boolean
  /** 结束节点：输出需配置上游引用（参数值） */
  showValueColumn?: boolean
  upstreamRefTree?: RefSelectTreeNode[]
}>()

const emit = defineEmits<{
  update: [path: number[], patch: Partial<FlowParameter>]
  remove: [path: number[]]
  addChild: [path: number[]]
}>()

const depth = computed(() => props.depth ?? 0)
const refTypeOptions = REF_TYPE_OPTIONS.filter(o => o.value !== 'input')

const indentStyle = computed(() =>
  depth.value > 0 ? { marginLeft: `${depth.value * 12}px` } : undefined
)

function outputDataTypeOptions(out: FlowParameter) {
  if (out.dataTypeItems?.length)
    return out.dataTypeItems
  return PARAMETER_DATA_TYPES
}

function showAddChildButton(out: FlowParameter) {
  if (props.readonly || out.addChildDisabled === true)
    return false
  return out.dataType === 'Object' || out.dataType === 'Array'
}

function onTextInput(handler: (value: string) => void) {
  return (value: string) => handler(value)
}

function patch(patch: Partial<FlowParameter>) {
  emit('update', props.path, patch)
}
</script>

<template>
  <div class="tf-output-param-group">
    <div
      class="tf-output-param-row nodrag"
      :style="indentStyle"
    >
      <div class="tf-output-param-cell tf-output-param-cell--name">
        <Input
          :model-value="param.name || ''"
          placeholder="请输入参数"
          :disabled="readonly || param.nameDisabled === true"
          @input="onTextInput(v => patch({ name: v }))"
        />
      </div>
      <div
        v-if="showValueColumn"
        class="tf-output-param-cell tf-output-param-cell--value"
      >
        <TreeSelect
          v-if="(param.refType || 'ref') === 'ref' && (upstreamRefTree?.length ?? 0) > 0"
          :model-value="param.ref || undefined"
          :data="upstreamRefTree"
          :field-names="{ key: 'key', title: 'title', children: 'children' }"
          allow-search
          allow-clear
          placeholder="选择上游输出变量"
          :disabled="readonly"
          @change="(v: string | undefined) => patch({ ref: v ?? '' })"
        />
        <Input
          v-else-if="(param.refType || 'ref') === 'ref'"
          :model-value="param.ref || ''"
          placeholder="无上游节点时可手填，如 node_xxx.output"
          :disabled="readonly"
          @input="onTextInput(v => patch({ ref: v }))"
        />
        <Input
          v-else-if="(param.refType || 'ref') === 'fixed'"
          :model-value="String(param.value ?? '')"
          placeholder="请输入固定值"
          :disabled="readonly"
          @input="onTextInput(v => patch({ value: v }))"
        />
        <Input
          v-else
          model-value="在执行期间，由用户输入"
          disabled
        />
      </div>
      <div class="tf-output-param-cell tf-output-param-cell--type">
        <Select
          :model-value="param.dataType || 'String'"
          :disabled="readonly || param.dataTypeDisabled === true"
          @change="(v: string) => patch({ dataType: v })"
        >
          <Select.Option
            v-for="opt in outputDataTypeOptions(param)"
            :key="String(opt.value)"
            :value="opt.value"
          >
            {{ opt.label }}
          </Select.Option>
        </Select>
        <button
          v-if="showAddChildButton(param)"
          type="button"
          class="input-btn-more"
          :disabled="readonly"
          title="添加子参数"
          @click="emit('addChild', path)"
        >
          <IconPlus />
        </button>
      </div>
      <div class="tf-output-param-cell tf-output-param-cell--actions">
        <Popover
          position="left"
          trigger="click"
          :disabled="readonly"
          popup-container="body"
          content-class="flowgame-output-more-popover"
        >
          <button
            type="button"
            class="input-btn-more"
            :disabled="readonly"
            title="更多设置"
          >
            <span class="tf-output-more-dots" aria-hidden="true">⋯</span>
          </button>
          <template #content>
            <div class="input-more-setting">
              <div v-if="showValueColumn" class="input-more-item">
                <span>数据来源：</span>
                <Select
                  :model-value="param.refType || 'ref'"
                  size="small"
                  :disabled="readonly"
                  @change="(v: string) => patch({ refType: v })"
                >
                  <Select.Option
                    v-for="opt in refTypeOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </Select.Option>
                </Select>
              </div>
              <div class="input-more-item">
                <span>默认值：</span>
                <Textarea
                  :model-value="String(param.defaultValue ?? '')"
                  :auto-size="{ minRows: 1, maxRows: 2 }"
                  style="width: 100%"
                  @update:model-value="(v: string) => patch({ defaultValue: v ?? '' })"
                />
              </div>
              <div class="input-more-item">
                <span>参数描述：</span>
                <Textarea
                  :model-value="String(param.description ?? '')"
                  :auto-size="{ minRows: 3, maxRows: 6 }"
                  style="width: 100%"
                  @update:model-value="(v: string) => patch({ description: v ?? '' })"
                />
              </div>
              <div v-if="!readonly && param.deleteDisabled !== true" class="input-more-item">
                <Button
                  type="primary"
                  status="danger"
                  size="small"
                  long
                  @click="emit('remove', path)"
                >
                  删除
                </Button>
              </div>
            </div>
          </template>
        </Popover>
      </div>
    </div>

    <OutputDefInspectorRow
      v-for="(child, childIndex) in param.children ?? []"
      :key="child.id || `${path.join('-')}-${childIndex}`"
      :param="child"
      :path="[...path, childIndex]"
      :depth="depth + 1"
      :readonly="readonly"
      :show-value-column="showValueColumn"
      :upstream-ref-tree="upstreamRefTree"
      @update="(p, patch) => emit('update', p, patch)"
      @remove="p => emit('remove', p)"
      @add-child="p => emit('addChild', p)"
    />
  </div>
</template>

<style scoped lang="scss">
.tf-output-more-dots {
  font-size: 16px;
  line-height: 1;
  letter-spacing: 1px;
}

.input-more-setting {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  width: 200px;
  background: var(--tf-background, var(--color-bg-1));
  border: 1px solid var(--tf-border, var(--color-border-2));
  border-radius: 5px;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.1);
}

.input-more-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: var(--tf-muted-foreground, var(--color-text-3));
}

.input-btn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.tf-output-param-cell--name :deep(.arco-input-wrapper),
.tf-output-param-cell--value :deep(.arco-input-wrapper),
.tf-output-param-cell--value :deep(.arco-tree-select) {
  width: 100%;
}
</style>
