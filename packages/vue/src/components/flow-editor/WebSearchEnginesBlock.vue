<script setup lang="ts">
import { Checkbox, CheckboxGroup } from '@arco-design/web-vue'
import { computed } from 'vue'
import {
  WEB_SEARCH_ENGINE_OPTIONS,
  normalizeWebSearchEngines
} from '@flowgame/core'

const props = defineProps<{
  engines: unknown
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:engines': [value: string[]]
}>()

const selected = computed(() => normalizeWebSearchEngines(props.engines))

function onChange(value: (string | number | boolean)[]) {
  emit('update:engines', normalizeWebSearchEngines(value.map(String)))
}
</script>

<template>
  <section class="tf-node-panel__block">
    <div class="heading tf-node-panel__form-heading">
      <h3 class="tf-node-panel__heading-text">
        搜索引擎设置
      </h3>
    </div>
    <div class="setting-title">
      搜索引擎
    </div>
    <div class="setting-item">
      <CheckboxGroup
        :model-value="selected"
        direction="vertical"
        :disabled="readonly"
        @change="onChange"
      >
        <Checkbox
          v-for="opt in WEB_SEARCH_ENGINE_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          <span class="flowgame-web-search-engine-label">{{ opt.label }}</span>
          <span
            v-if="opt.description"
            class="flowgame-web-search-engine-desc"
          >{{ opt.description }}</span>
        </Checkbox>
      </CheckboxGroup>
    </div>
    <p class="tf-node-panel__field-desc">
      当前仅支持腾讯新闻（Playwright）；本地需 playwright install chromium（Docker 已内置）
    </p>
  </section>
</template>

<style scoped>
.flowgame-web-search-engine-label {
  font-weight: 500;
}
.flowgame-web-search-engine-desc {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--color-text-3, #86909c);
  line-height: 1.35;
}
</style>
