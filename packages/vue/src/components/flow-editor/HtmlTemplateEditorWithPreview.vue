<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Input, Tabs, TabPane, Textarea } from '@arco-design/web-vue'
import {
  applyHtmlPreviewToIframe,
  disposeHtmlPreviewIframe,
  formatHtmlTemplate,
  HTML_TEMPLATE_PLACEHOLDER,
  mergeHtmlTemplatePreviewMap,
  wrapHtmlPreviewDocument
} from '@flowgame/core'
import type { FlowParameter } from '@flowgame/core'

/** 与动态代码节点「执行代码」多行框一致 */
const TEMPLATE_TEXTAREA_AUTO_SIZE = { minRows: 10, maxRows: 20 } as const

const props = withDefaults(
  defineProps<{
    modelValue: string
    parameters?: FlowParameter[]
    readonly?: boolean
    variant?: 'inspector' | 'canvas'
  }>(),
  {
    parameters: () => [],
    readonly: false,
    variant: 'inspector'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeTab = ref('edit')
const previewValues = ref<Record<string, string>>({})
const showCanvasPreview = ref(false)
const previewIframeRef = ref<HTMLIFrameElement | null>(null)
const canvasPreviewIframeRef = ref<HTMLIFrameElement | null>(null)

watch(
  () => props.parameters,
  (params) => {
    previewValues.value = mergeHtmlTemplatePreviewMap(params, previewValues.value)
  },
  { immediate: true, deep: true }
)

const previewParamRows = computed(() =>
  props.parameters
    .map(p => ({ name: (p.name || '').trim(), param: p }))
    .filter(row => row.name)
)

const renderedHtml = computed(() =>
  formatHtmlTemplate(props.modelValue, previewValues.value)
)

const previewSrcdoc = computed(() => wrapHtmlPreviewDocument(renderedHtml.value))

const isInspector = computed(() => props.variant === 'inspector')

function syncInspectorPreviewIframe() {
  if (!isInspector.value || activeTab.value !== 'preview')
    return
  nextTick(() => {
    applyHtmlPreviewToIframe(previewIframeRef.value, previewSrcdoc.value)
  })
}

watch([previewSrcdoc, activeTab, isInspector], syncInspectorPreviewIframe, { immediate: true })

watch(showCanvasPreview, (open) => {
  if (!open) {
    disposeHtmlPreviewIframe(canvasPreviewIframeRef.value)
    return
  }
  nextTick(() => {
    applyHtmlPreviewToIframe(canvasPreviewIframeRef.value, previewSrcdoc.value)
  })
})

watch(previewSrcdoc, () => {
  if (showCanvasPreview.value) {
    nextTick(() => {
      applyHtmlPreviewToIframe(canvasPreviewIframeRef.value, previewSrcdoc.value)
    })
  }
})

onBeforeUnmount(() => {
  disposeHtmlPreviewIframe(previewIframeRef.value)
  disposeHtmlPreviewIframe(canvasPreviewIframeRef.value)
})

function setPreviewValue(name: string, value: string) {
  previewValues.value = { ...previewValues.value, [name]: value }
}

function onTemplateInput(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div
    class="flowgame-html-template-editor"
    :class="`flowgame-html-template-editor--${variant}`"
  >
    <template v-if="isInspector">
      <Tabs v-model:active-key="activeTab" type="rounded" size="small" class="flowgame-html-template-editor__tabs">
        <TabPane key="edit" title="编辑" :destroy-on-hide="false">
          <div class="setting-title">
            模板内容
          </div>
          <div class="setting-item tf-code-node__code-item">
            <Textarea
              :model-value="modelValue"
              :placeholder="HTML_TEMPLATE_PLACEHOLDER"
              :auto-size="TEMPLATE_TEXTAREA_AUTO_SIZE"
              :disabled="readonly"
              @update:model-value="onTemplateInput"
            />
          </div>
        </TabPane>
        <TabPane key="preview" title="预览" :destroy-on-hide="false">
          <div class="flowgame-html-template-editor__preview-pane">
            <p class="flowgame-html-template-editor__hint">
              占位符按下方示例值替换，与运行时的 <code v-pre>{{ 参数名 }}</code> 规则一致。
            </p>
            <div
              v-if="previewParamRows.length"
              class="flowgame-html-template-editor__sample-grid"
            >
              <div
                v-for="row in previewParamRows"
                :key="row.name"
                class="flowgame-html-template-editor__sample-row"
              >
                <span class="flowgame-html-template-editor__sample-label" :title="row.name">
                  {{ row.name }}
                </span>
                <Input
                  :model-value="previewValues[row.name] ?? ''"
                  size="small"
                  :disabled="readonly"
                  placeholder="预览示例值"
                  @input="(v: string) => setPreviewValue(row.name, v)"
                />
              </div>
            </div>
            <p v-else class="flowgame-html-template-editor__hint flowgame-html-template-editor__hint--muted">
              请先在「输入参数」中添加参数名称，预览将替换模板中的占位符。
            </p>
            <div class="flowgame-html-template-editor__iframe-wrap">
              <iframe
                ref="previewIframeRef"
                class="flowgame-html-template-editor__iframe"
                title="html-template-preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </TabPane>
      </Tabs>
    </template>

    <template v-else>
      <div class="setting-title">
        模板内容
      </div>
      <div class="setting-item tf-code-node__code-item nopan nodrag nokey nowheel">
        <Textarea
          :model-value="modelValue"
          :placeholder="HTML_TEMPLATE_PLACEHOLDER"
          :auto-size="TEMPLATE_TEXTAREA_AUTO_SIZE"
          :disabled="readonly"
          @update:model-value="onTemplateInput"
        />
      </div>
      <button
        type="button"
        class="flowgame-html-template-editor__canvas-preview-btn nopan nodrag"
        @click="showCanvasPreview = !showCanvasPreview"
      >
        {{ showCanvasPreview ? '收起预览' : '预览 HTML' }}
      </button>
      <div v-if="showCanvasPreview" class="flowgame-html-template-editor__preview-pane flowgame-html-template-editor__preview-pane--canvas">
        <div
          v-if="previewParamRows.length"
          class="flowgame-html-template-editor__sample-grid flowgame-html-template-editor__sample-grid--compact"
        >
          <div
            v-for="row in previewParamRows"
            :key="row.name"
            class="flowgame-html-template-editor__sample-row"
          >
            <span class="flowgame-html-template-editor__sample-label">{{ row.name }}</span>
            <Input
              :model-value="previewValues[row.name] ?? ''"
              size="mini"
              :disabled="readonly"
              @input="(v: string) => setPreviewValue(row.name, v)"
            />
          </div>
        </div>
        <div class="flowgame-html-template-editor__iframe-wrap flowgame-html-template-editor__iframe-wrap--canvas">
          <iframe
            ref="canvasPreviewIframeRef"
            class="flowgame-html-template-editor__iframe"
            title="html-template-preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.flowgame-html-template-editor {
  width: 100%;
}

/* 与 NodeInspectorPanel 动态代码「执行代码」区块一致 */
.setting-title {
  font-size: 12px;
  color: var(--tf-secondary-foreground, var(--color-text-3));
  margin-bottom: 4px;
  margin-top: 10px;
}

.flowgame-html-template-editor--canvas .setting-title {
  margin-top: 6px;
  color: var(--tf-muted-foreground, #86909c);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 10px;
  width: 100%;
}

.tf-code-node__code-item {
  align-items: stretch;

  :deep(.arco-textarea-wrapper) {
    width: 100%;
  }
}

.flowgame-html-template-editor__tabs {
  :deep(.arco-tabs-nav) {
    margin-bottom: 8px;
  }

  .setting-title {
    margin-top: 0;
  }
}

.flowgame-html-template-editor__hint {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--tf-muted-foreground, var(--color-text-3));

  code {
    font-size: 11px;
    padding: 0 4px;
    border-radius: 3px;
    background: var(--color-fill-2, #f2f3f5);
  }

  &--muted {
    color: var(--color-text-4, #c9cdd4);
  }
}

.flowgame-html-template-editor__sample-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.flowgame-html-template-editor__sample-grid--compact {
  max-height: 72px;
  margin-bottom: 6px;
}

.flowgame-html-template-editor__sample-row {
  display: grid;
  grid-template-columns: minmax(0, 0.45fr) minmax(0, 1fr);
  gap: 6px;
  align-items: center;
}

.flowgame-html-template-editor__sample-label {
  font-size: 12px;
  color: var(--tf-muted-foreground, var(--color-text-3));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flowgame-html-template-editor__iframe-wrap {
  border: 1px solid var(--tf-border, var(--color-border-2));
  border-radius: calc(var(--tf-radius, 14px) * 0.6);
  overflow: hidden;
  background: #fff;
}

.flowgame-html-template-editor__iframe-wrap--canvas {
  margin-top: 4px;
}

.flowgame-html-template-editor__iframe {
  display: block;
  width: 100%;
  height: 280px;
  border: none;
  background: #fff;
}

.flowgame-html-template-editor--canvas .flowgame-html-template-editor__iframe {
  height: 160px;
}

.flowgame-html-template-editor__canvas-preview-btn {
  display: inline-flex;
  margin-top: 6px;
  padding: 0;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(var(--primary-6, 22, 93, 255));
  background: none;
  border: none;
  cursor: pointer;
}

.flowgame-html-template-editor__canvas-preview-btn:hover {
  text-decoration: underline;
}

.flowgame-html-template-editor__preview-pane--canvas {
  margin-top: 4px;
}
</style>
