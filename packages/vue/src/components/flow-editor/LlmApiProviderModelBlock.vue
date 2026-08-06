<script setup lang="ts">
import { Select } from '@arco-design/web-vue'
import { computed } from 'vue'
import {
  DEFAULT_LLMAPI_PROVIDER,
  DEFAULT_LLMAPI_MODEL_NAME,
  LLMAPI_PROVIDER_OPTIONS,
  getLlmApiModelOptions,
  isLlmApiTemplateValue,
  normalizeLlmApiProvider,
  resolveLlmApiModelForProvider
} from '@flowgame/core'

const props = defineProps<{
  modelProvider?: unknown
  modelName?: unknown
  readonly?: boolean
}>()

const emit = defineEmits<{
  change: [payload: { modelProvider: string, modelName: string }]
}>()

const provider = computed(() => {
  const raw = String(props.modelProvider ?? '').trim()
  if (!raw)
    return DEFAULT_LLMAPI_PROVIDER
  if (isLlmApiTemplateValue(raw))
    return raw
  return normalizeLlmApiProvider(raw)
})

const modelOptions = computed(() => {
  const opts = getLlmApiModelOptions(provider.value)
  const current = String(props.modelName ?? '').trim()
  if (current && !opts.some(o => o.value === current))
    return [{ label: current, value: current }, ...opts]
  return opts
})

const providerOptions = computed(() => {
  const opts = [...LLMAPI_PROVIDER_OPTIONS]
  const current = provider.value
  if (current && !opts.some(o => o.value === current))
    return [{ label: current, value: current }, ...opts]
  return opts
})

const modelName = computed(() => {
  const raw = String(props.modelName ?? '').trim()
  if (!raw)
    return isLlmApiTemplateValue(provider.value) ? '' : DEFAULT_LLMAPI_MODEL_NAME
  if (isLlmApiTemplateValue(raw) || isLlmApiTemplateValue(provider.value))
    return raw
  return resolveLlmApiModelForProvider(provider.value, raw)
})

function onProviderChange(value: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const next = String(Array.isArray(value) ? value[0] : value || '').trim()
  const nextModel = isLlmApiTemplateValue(next)
    ? (isLlmApiTemplateValue(modelName.value) ? modelName.value : '{{modelName}}')
    : resolveLlmApiModelForProvider(next, isLlmApiTemplateValue(modelName.value) ? undefined : modelName.value)
  emit('change', { modelProvider: next || DEFAULT_LLMAPI_PROVIDER, modelName: nextModel })
}

function onModelChange(value: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const next = String(Array.isArray(value) ? value[0] : value || '').trim()
  emit('change', {
    modelProvider: provider.value || DEFAULT_LLMAPI_PROVIDER,
    modelName: next
  })
}
</script>

<template>
  <section class="tf-node-panel__block flowgame-llmapi-provider-block">
    <div class="heading tf-node-panel__form-heading">
      <h3 class="tf-node-panel__heading-text">
        模型厂家与名称
      </h3>
    </div>
    <div class="setting-title">
      模型厂家
    </div>
    <div class="setting-item flowgame-llmapi-provider-block__item">
      <Select
        :model-value="provider"
        :disabled="readonly"
        placeholder="选择厂家，或输入 {{modelProvider}}"
        allow-search
        allow-create
        @change="onProviderChange"
      >
        <Select.Option
          v-for="opt in providerOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </Select.Option>
      </Select>
    </div>
    <p class="tf-node-panel__field-desc">
      可下拉选择，也可输入 <code v-pre>{{modelProvider}}</code>；执行时用同名入参替换
    </p>
    <div class="setting-title">
      模型名称
    </div>
    <div class="setting-item flowgame-llmapi-provider-block__item">
      <Select
        :model-value="modelName"
        :disabled="readonly"
        placeholder="选择模型，或输入 {{modelName}}"
        allow-search
        allow-create
        @change="onModelChange"
      >
        <Select.Option
          v-for="opt in modelOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </Select.Option>
      </Select>
    </div>
    <p class="tf-node-panel__field-desc">
      可下拉选择，也可输入 <code v-pre>{{modelName}}</code>；API Key 同理支持 <code v-pre>{{apiKey}}</code>
    </p>
  </section>
</template>

<style scoped>
.flowgame-llmapi-provider-block__item {
  display: block;
  width: 100%;
  margin-bottom: 4px;
}

.flowgame-llmapi-provider-block__item :deep(.arco-select) {
  width: 100%;
}

.flowgame-llmapi-provider-block__item :deep(.arco-select-view-single) {
  width: 100%;
  border-radius: 8px;
}

.flowgame-llmapi-provider-block .tf-node-panel__field-desc {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--tf-muted-foreground, var(--color-text-3));
}

.flowgame-llmapi-provider-block .tf-node-panel__field-desc code {
  font-size: 11px;
  padding: 0 4px;
  border-radius: 4px;
  background: var(--color-fill-2, #f2f3f5);
}
</style>
