<script setup lang="ts">
import { computed } from 'vue'
import { Input, Popover, Select, TreeSelect } from '@arco-design/web-vue'
import { IconDelete, IconPlus } from '@arco-design/web-vue/es/icon'
import type { RefSelectTreeNode } from '@flowgame/core'
import {
  appendMemoryWriteGroup,
  contextKeyParamName,
  memoryValueParamName,
  parseMemoryWriteGroups,
  removeMemoryWriteGroupBySuffix,
  type MemoryWriteGroupView
} from '@flowgame/core'
import {
  REF_TYPE_OPTIONS,
  type FlowParameter
} from '@flowgame/core'

const props = defineProps<{
  parameters: FlowParameter[]
  upstreamRefTree: RefSelectTreeNode[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  replace: [parameters: FlowParameter[]]
}>()

const groups = computed(() => parseMemoryWriteGroups(props.parameters))
const refTypeOptions = REF_TYPE_OPTIONS.filter(o => o.value !== 'input')

function patchParam(index: number, patch: Partial<FlowParameter>) {
  const next = props.parameters.map((p, i) =>
    i === index ? { ...p, ...patch } : p
  )
  emit('replace', next)
}

function addGroup() {
  emit('replace', appendMemoryWriteGroup(props.parameters))
}

function removeGroup(group: MemoryWriteGroupView) {
  if (groups.value.length <= 1)
    return
  emit('replace', removeMemoryWriteGroupBySuffix(props.parameters, group.suffix))
}

function groupRows(group: MemoryWriteGroupView) {
  return [
    {
      label: contextKeyParamName(group.suffix),
      index: group.contextKeyIndex,
      param: props.parameters[group.contextKeyIndex]
    },
    {
      label: memoryValueParamName(group.suffix),
      index: group.memoryValueIndex,
      param: props.parameters[group.memoryValueIndex]
    }
  ]
}
</script>

<template>
  <p class="tf-node-panel__field-desc">
    每组包含 contextKey 与 memoryValue，可引用上游变量；多组写入不同 Redis 列表。
  </p>

  <div class="input-container tf-kb-input-container flowgame-mw-inspector">
    <div class="input-header">
      参数名称
    </div>
    <div class="input-header">
      参数值
    </div>
    <div class="input-header" aria-hidden="true" />

    <template
      v-for="(group, groupIndex) in groups"
      :key="group.suffix"
    >
      <div
        v-if="groupIndex > 0"
        class="flowgame-mw-inspector-divider"
      >
        <span>记忆组 {{ groupIndex + 1 }}</span>
        <button
          v-if="!readonly"
          type="button"
          class="flowgame-mw-inspector-divider__del"
          title="删除本组"
          @click="removeGroup(group)"
        >
          <IconDelete />
        </button>
      </div>

      <template
        v-for="row in groupRows(group)"
        :key="`${group.suffix}-${row.label}`"
      >
        <div class="input-item">
          <span class="tf-param-name-label">{{ row.label }}</span>
        </div>
        <div class="input-item">
          <TreeSelect
            v-if="(row.param.refType || 'ref') === 'ref' && upstreamRefTree.length"
            :model-value="row.param.ref || undefined"
            :data="upstreamRefTree"
            :field-names="{ key: 'key', title: 'title', children: 'children' }"
            allow-search
            allow-clear
            placeholder="请选择上游变量"
            :disabled="readonly"
            @change="(v: string | undefined) => patchParam(row.index, { ref: v ?? '' })"
          />
          <Input
            v-else-if="(row.param.refType || 'ref') === 'ref'"
            :model-value="row.param.ref || ''"
            placeholder="请输入引用路径"
            :disabled="readonly"
            @input="v => patchParam(row.index, { ref: v })"
          />
          <Input
            v-else-if="(row.param.refType || 'ref') === 'fixed'"
            :model-value="String(row.param.value ?? '')"
            placeholder="请输入参数值"
            :disabled="readonly"
            @input="v => patchParam(row.index, { value: v })"
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
            <button
              type="button"
              class="input-btn-more"
              title="更多设置"
            >
              ⋯
            </button>
            <template #content>
              <div class="input-more-setting">
                <div class="input-more-item">
                  <span>数据来源：</span>
                  <Select
                    :model-value="row.param.refType || 'ref'"
                    size="small"
                    @change="(v: string) => patchParam(row.index, { refType: v })"
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
              </div>
            </template>
          </Popover>
          <button
            v-if="!readonly && groups.length > 1 && groupIndex === 0 && row.label === memoryValueParamName(group.suffix)"
            type="button"
            class="input-btn-more tf-node-panel__del-btn"
            title="删除本组"
            @click="removeGroup(group)"
          >
            <IconDelete />
          </button>
        </div>
      </template>
    </template>
  </div>

  <button
    v-if="!readonly"
    type="button"
    class="flowgame-mw-inspector-add"
    @click="addGroup"
  >
    <IconPlus />
    添加记忆组
  </button>
</template>

<style scoped lang="scss">
@use '../../styles/kb-input-container.scss';

.flowgame-mw-inspector-divider {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 2px;
  padding-top: 8px;
  border-top: 1px dashed var(--tf-border, var(--color-border-2));
  font-size: 11px;
  color: var(--tf-muted-foreground, var(--color-text-3));
}

.flowgame-mw-inspector-divider__del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-3);
  cursor: pointer;

  &:hover {
    color: rgb(var(--danger-6));
    background: var(--color-fill-2);
  }
}

.flowgame-mw-inspector-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: rgb(var(--primary-6));
  background: transparent;
  border: 1px dashed rgb(var(--primary-3));
  border-radius: 4px;
  cursor: pointer;
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
}
</style>
