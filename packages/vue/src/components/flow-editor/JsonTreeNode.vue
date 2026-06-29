<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'

defineOptions({ name: 'JsonTreeNode' })

const props = withDefaults(defineProps<{
  nodeKey?: string
  value: unknown
  depth?: number
  isArrayItem?: boolean
}>(), {
  depth: 0,
  isArrayItem: false
})

interface JsonTreeContext {
  expandDepth: { value: number }
  collapseAllToken: { value: number }
}

const treeContext = inject<JsonTreeContext>('jsonTreeContext')
const expanded = ref(props.depth < (treeContext?.expandDepth.value ?? 2))

watch(
  () => treeContext?.expandDepth.value,
  (depth) => {
    if (depth == null)
      return
    expanded.value = props.depth < depth
  }
)

watch(
  () => treeContext?.collapseAllToken.value,
  () => {
    expanded.value = false
  }
)

const valueType = computed(() => {
  if (props.value === null)
    return 'null'
  if (Array.isArray(props.value))
    return 'array'
  return typeof props.value
})

const isExpandable = computed(() => valueType.value === 'object' || valueType.value === 'array')

const childEntries = computed(() => {
  if (valueType.value === 'array')
    return (props.value as unknown[]).map((item, index) => ({ key: String(index), value: item }))
  if (valueType.value === 'object' && props.value !== null)
    return Object.entries(props.value as Record<string, unknown>).map(([key, value]) => ({ key, value }))
  return []
})

const collectionLabel = computed(() => {
  if (valueType.value === 'array')
    return `Array(${(props.value as unknown[]).length})`
  if (valueType.value === 'object')
    return `Object(${childEntries.value.length})`
  return ''
})

function toggle() {
  if (isExpandable.value)
    expanded.value = !expanded.value
}

function formatPrimitive(value: unknown) {
  if (value === null)
    return 'null'
  if (typeof value === 'string')
    return JSON.stringify(value)
  return String(value)
}

function onValueClick() {
  if (isExpandable.value)
    toggle()
}
</script>

<template>
  <div class="json-tree-node" :style="{ paddingLeft: depth > 0 ? '18px' : '0' }">
    <div class="json-tree-node__line">
      <button
        v-if="isExpandable"
        type="button"
        class="json-tree-node__toggle"
        :aria-label="expanded ? '折叠' : '展开'"
        @click="toggle"
      >
        {{ expanded ? '−' : '+' }}
      </button>
      <span v-else class="json-tree-node__toggle-placeholder" />

      <span v-if="nodeKey != null && !isArrayItem" class="json-tree-node__key">"{{ nodeKey }}"</span>
      <span v-if="nodeKey != null && !isArrayItem" class="json-tree-node__colon">: </span>

      <template v-if="isExpandable">
        <span class="json-tree-node__brace" @click="onValueClick">{{ valueType === 'array' ? '[' : '{' }}</span>
        <span v-if="!expanded" class="json-tree-node__ellipsis" @click="toggle">
          … {{ collectionLabel }}
        </span>
        <span v-if="!expanded" class="json-tree-node__brace" @click="toggle">{{ valueType === 'array' ? ']' : '}' }}</span>
      </template>

      <span
        v-else
        class="json-tree-node__primitive"
        :class="`json-tree-node__primitive--${valueType}`"
      >{{ formatPrimitive(value) }}</span>
    </div>

    <template v-if="isExpandable && expanded">
      <JsonTreeNode
        v-for="entry in childEntries"
        :key="entry.key"
        :node-key="valueType === 'object' ? entry.key : entry.key"
        :value="entry.value"
        :depth="depth + 1"
        :is-array-item="valueType === 'array'"
      />
      <div class="json-tree-node__line json-tree-node__close">
        <span class="json-tree-node__toggle-placeholder" />
        <span class="json-tree-node__brace">{{ valueType === 'array' ? ']' : '}' }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.json-tree-node {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.json-tree-node__line {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  min-height: 20px;
}

.json-tree-node__toggle {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  padding: 0;
  border: 1px solid rgb(var(--danger-6));
  border-radius: 50%;
  background: #fff;
  color: rgb(var(--danger-6));
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;

  &:hover {
    background: rgba(var(--danger-6), 0.08);
  }
}

.json-tree-node__toggle-placeholder {
  flex-shrink: 0;
  width: 16px;
}

.json-tree-node__key {
  color: #a31515;
  flex-shrink: 0;
}

.json-tree-node__colon {
  color: var(--color-text-2);
}

.json-tree-node__brace {
  color: var(--color-text-2);
  cursor: pointer;
  user-select: none;
}

.json-tree-node__ellipsis {
  color: var(--color-text-3);
  cursor: pointer;
  user-select: none;
  margin: 0 4px;
}

.json-tree-node__primitive {
  word-break: break-all;
  white-space: pre-wrap;

  &--string {
    color: #0b8235;
  }

  &--number {
    color: #1c00cf;
  }

  &--boolean {
    color: #1c00cf;
  }

  &--null {
    color: #808080;
  }
}

.json-tree-node__close {
  margin-top: 0;
}
</style>
