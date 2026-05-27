<script setup lang="ts">
import { Input, Popover, Select, TreeSelect } from '@arco-design/web-vue'
import { IconDelete } from '@arco-design/web-vue/es/icon'
import type { RefSelectTreeNode } from '@flowgame/core'
import {
  REF_TYPE_OPTIONS,
  type FlowParameter
} from '@flowgame/core'

defineProps<{
  parameters: FlowParameter[]
  upstreamRefTree: RefSelectTreeNode[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  update: [index: number, patch: Partial<FlowParameter>]
  remove: [index: number]
}>()

const refTypeOptions = REF_TYPE_OPTIONS.filter(o => o.value !== 'input')

function canEditName(param: FlowParameter) {
  return param.nameDisabled !== true
}

function canDelete(param: FlowParameter) {
  return param.deleteDisabled !== true
}
</script>

<template>
  <div class="input-container tf-kb-input-container flowgame-html-template-inspector">
    <div class="input-header">
      参数名称
    </div>
    <div class="input-header">
      参数值
    </div>
    <div class="input-header" aria-hidden="true" />

    <template v-for="(param, index) in parameters" :key="param.id || `html-in-${index}`">
      <div class="input-item">
        <Input
          v-if="canEditName(param)"
          :model-value="param.name || ''"
          placeholder="参数名称"
          :disabled="readonly"
          @input="v => emit('update', index, { name: v })"
        />
        <span v-else class="tf-param-name-label">{{ param.name || '' }}</span>
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
          @change="(v: string | undefined) => emit('update', index, { ref: v ?? '' })"
        />
        <Input
          v-else-if="(param.refType || 'ref') === 'ref'"
          :model-value="param.ref || ''"
          placeholder="请输入引用路径"
          :disabled="readonly"
          @input="v => emit('update', index, { ref: v })"
        />
        <Input
          v-else-if="(param.refType || 'ref') === 'fixed'"
          :model-value="String(param.value ?? param.defaultValue ?? '')"
          placeholder="请输入固定值"
          :disabled="readonly"
          @input="v => emit('update', index, { value: v })"
        />
        <Input
          v-else
          model-value="在执行期间，由用户输入"
          disabled
        />
      </div>
      <div class="input-item tf-kb-input-container__more flowgame-html-template-inspector__more">
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
              <div v-if="param.description" class="input-more-item input-more-item--desc">
                <span>参数描述：</span>
                <span class="input-more-item__desc-text">{{ param.description }}</span>
              </div>
              <p v-if="param.name" class="input-more-item input-more-item--hint">
                在 HTML 模板中写 <span class="input-more-item__placeholder">{{ `\{\{ ${param.name} \}\}` }}</span> 引用该入参
              </p>
            </div>
          </template>
        </Popover>
        <button
          v-if="!readonly && canDelete(param)"
          type="button"
          class="input-btn-more tf-node-panel__del-btn"
          title="删除参数"
          @click="emit('remove', index)"
        >
          <IconDelete />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/kb-input-container.scss';

.flowgame-html-template-inspector__more {
  gap: 4px;
}

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

.tf-node-panel__del-btn {
  color: var(--color-text-3);

  &:hover:not(:disabled) {
    color: rgb(var(--danger-6, 245, 63, 63));
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
  width: 220px;
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

  &--hint {
    margin: 0;
    line-height: 1.4;
  }

  &__placeholder {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    color: var(--tf-foreground, var(--color-text-2));
  }

  &__desc-text {
    color: var(--tf-foreground, var(--color-text-2));
    line-height: 1.4;
    word-break: break-word;
  }
}
</style>
