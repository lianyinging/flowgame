<script setup lang="ts">
import { computed } from 'vue'
import { Input, Popover, Select, TreeSelect } from '@arco-design/web-vue'
import type { RefSelectTreeNode } from './build-workflow-variable-tree'
import {
  REF_TYPE_OPTIONS,
  type FlowParameter
} from './node-inspector-config'

const props = defineProps<{
  parameters: FlowParameter[]
  upstreamRefTree: RefSelectTreeNode[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  update: [index: number, patch: Partial<FlowParameter>]
}>()

const KNOWLEDGE_PARAM_ORDER = ['limit', 'keyword'] as const

const orderedRows = computed(() => {
  const rows: { index: number, param: FlowParameter }[] = []
  for (const name of KNOWLEDGE_PARAM_ORDER) {
    const index = props.parameters.findIndex(p => p.name === name)
    if (index >= 0)
      rows.push({ index, param: props.parameters[index] })
  }
  return rows
})

const refTypeOptions = REF_TYPE_OPTIONS.filter(o => o.value !== 'input')

function onTextInput(handler: (value: string) => void) {
  return (value: string) => handler(value)
}
</script>

<template>
  <div class="input-container tf-kb-input-container">
    <div class="input-header">
      参数名称
    </div>
    <div class="input-header">
      参数值
    </div>
    <div class="input-header" aria-hidden="true" />

    <template v-for="{ index, param } in orderedRows" :key="param.id || param.name">
      <div class="input-item">
        <span class="tf-param-name-label">{{ param.name || '' }}</span>
      </div>
      <div class="input-item">
        <Input
          v-if="(param.refType || 'ref') === 'fixed'"
          :model-value="String(param.value ?? param.defaultValue ?? '')"
          placeholder="请输入参数值"
          :disabled="readonly"
          @input="onTextInput(v => emit('update', index, { value: v }))"
        />
        <TreeSelect
          v-else-if="(param.refType || 'ref') === 'ref' && upstreamRefTree.length"
          :model-value="param.ref || undefined"
          :data="upstreamRefTree"
          :field-names="{ key: 'key', title: 'title', children: 'children' }"
          allow-search
          allow-clear
          placeholder="请选择上游变量"
          :disabled="readonly"
          @change="(v: string | undefined) => emit('update', index, { ref: v ?? '' })"
        />
        <Input
          v-else-if="(param.refType || 'ref') === 'ref'"
          :model-value="param.ref || ''"
          placeholder="请输入引用路径"
          :disabled="readonly"
          @input="onTextInput(v => emit('update', index, { ref: v }))"
        />
        <Input
          v-else
          model-value="在执行期间，由用户输入"
          disabled
        />
      </div>
      <div class="input-item tf-kb-input-container__more">
        <Popover
          v-if="!readonly"
          position="bl"
          trigger="click"
          :content-style="{ padding: 0 }"
        >
          <button type="button" class="input-btn-more" title="更多设置">
            ⋯
          </button>
          <template #content>
            <div class="input-more-setting">
              <div class="input-more-item">
                <span>数据来源：</span>
                <Select
                  :model-value="param.refType || 'ref'"
                  size="small"
                  @change="(v: string) => emit('update', index, { refType: v })"
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
                <Input
                  size="small"
                  :model-value="String(param.defaultValue ?? '')"
                  placeholder="未设置时使用的默认值"
                  @input="onTextInput(v => emit('update', index, { defaultValue: v }))"
                />
              </div>
              <div v-if="param.description" class="input-more-item input-more-item--desc">
                <span>参数描述：</span>
                <span class="input-more-item__desc-text">{{ param.description }}</span>
              </div>
            </div>
          </template>
        </Popover>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use './kb-input-container.scss';

.input-btn-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border: 1px solid transparent;
  padding: 0 4px;
  border-radius: 4px;
  background: transparent;
  color: var(--tf-foreground, var(--color-text-2));
  cursor: pointer;
  font-size: 14px;
  line-height: 1;

  &:hover:not(:disabled) {
    background: var(--tf-input, var(--color-fill-2));
  }
}

.input-more-setting {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: var(--tf-background, var(--color-bg-1));
  border: 1px solid var(--tf-border, var(--color-border-2));
  border-radius: 5px;
  width: 200px;
  box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.08);
}

.input-more-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--tf-muted-foreground, var(--color-text-3));

  &--desc {
    gap: 2px;
  }

  &__desc-text {
    color: var(--tf-foreground, var(--color-text-2));
    line-height: 1.4;
    word-break: break-word;
  }
}
</style>
