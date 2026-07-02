<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Tinyflow } from '@tinyflow-ai/ui'
import { Dropdown } from '@arco-design/web-vue'
import {
  isCanvasInteractionLocked,
  isCanvasLeftToolbarVisible,
  toggleCanvasInteractionLock,
  toggleCanvasLeftToolbar
} from '@flowgame/core'
import {
  canvasFitView,
  canvasSetZoomPercent,
  canvasZoomIn,
  canvasZoomOut,
  getCanvasZoomPercent
} from '@flowgame/core'
import type { FlowEditorFormMode } from '../../types'
import { FLOW_EDITOR_MODE_LABEL } from '../../flow-editor-mode'

const props = defineProps<{
  tinyflow?: Tinyflow
  canvas?: HTMLElement
  editorMode?: FlowEditorFormMode
  flowName?: string
  readonly?: boolean
  runLoading?: boolean
  /** 右下角缩略图是否显示，默认 true */
  minimapVisible?: boolean
}>()

const showMinimap = computed(() => props.minimapVisible !== false)
const mode = computed(() => props.editorMode ?? (props.readonly ? 'view' : 'edit'))
const modeLabel = computed(() => FLOW_EDITOR_MODE_LABEL[mode.value])
const flowTitle = computed(() => props.flowName?.trim() || '未命名流程')
const canEdit = computed(() => mode.value !== 'view' && !props.readonly)

const emit = defineEmits<{
  run: []
  save: []
  'update:minimapVisible': [visible: boolean]
}>()

const zoomPercent = ref(100)
const zoomDropdownVisible = ref(false)
const locked = ref(false)
const leftMenuVisible = ref(false)

const zoomPresets = [50, 75, 100, 125, 150]

const zoomLabel = computed(() => `${zoomPercent.value}%`)

let zoomTimer: ReturnType<typeof setInterval> | null = null

function refreshZoom() {
  if (props.tinyflow)
    zoomPercent.value = getCanvasZoomPercent(props.tinyflow)
  locked.value = isCanvasInteractionLocked(props.canvas)
  leftMenuVisible.value = isCanvasLeftToolbarVisible(props.canvas)
}

function closeZoomDropdown() {
  zoomDropdownVisible.value = false
}

function onZoomPreset(percent: number) {
  canvasSetZoomPercent(props.tinyflow, percent)
  requestAnimationFrame(refreshZoom)
  closeZoomDropdown()
}

function onZoomIn() {
  canvasZoomIn(props.tinyflow)
  requestAnimationFrame(refreshZoom)
  closeZoomDropdown()
}

function onZoomOut() {
  canvasZoomOut(props.tinyflow)
  requestAnimationFrame(refreshZoom)
  closeZoomDropdown()
}

function onFitView() {
  canvasFitView(props.tinyflow)
  requestAnimationFrame(refreshZoom)
}

function onToggleLock() {
  toggleCanvasInteractionLock(props.canvas)
  requestAnimationFrame(refreshZoom)
}

function onToggleMinimap() {
  emit('update:minimapVisible', !showMinimap.value)
}

function onToggleLeftMenu() {
  if (!canEdit.value)
    return
  leftMenuVisible.value = toggleCanvasLeftToolbar(props.canvas)
}

watch(() => props.canvas, () => {
  refreshZoom()
})

onMounted(() => {
  refreshZoom()
  zoomTimer = setInterval(refreshZoom, 400)
})

onUnmounted(() => {
  if (zoomTimer)
    clearInterval(zoomTimer)
})
</script>

<template>
  <div class="flow-canvas-toolbar">
    <div class="flow-canvas-toolbar__group flow-canvas-toolbar__group--main">
      <Dropdown
        v-model:popup-visible="zoomDropdownVisible"
        trigger="click"
        position="bl"
        @popup-visible-change="(v: boolean) => v && refreshZoom()"
      >
        <button type="button" class="flow-canvas-toolbar__zoom" aria-label="缩放比例">
          <span class="flow-canvas-toolbar__zoom-value">{{ zoomLabel }}</span>
          <svg class="flow-canvas-toolbar__chevron" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M12 15.4l-6-6L7.4 8 12 12.6l4.6-4.6 1.4 1.4z" />
          </svg>
        </button>
        <template #content>
          <div class="flow-canvas-toolbar__zoom-menu">
            <button
              v-for="p in zoomPresets"
              :key="p"
              type="button"
              class="flow-canvas-toolbar__zoom-menu-item"
              :class="{ 'flow-canvas-toolbar__zoom-menu-item--active': zoomPercent === p }"
              @click="onZoomPreset(p)"
            >
              {{ p }}%
            </button>
            <div class="flow-canvas-toolbar__zoom-menu-actions">
              <button type="button" class="flow-canvas-toolbar__zoom-menu-action" @click="onZoomOut">
                缩小
              </button>
              <button type="button" class="flow-canvas-toolbar__zoom-menu-action" @click="onZoomIn">
                放大
              </button>
            </div>
          </div>
        </template>
      </Dropdown>

      <span class="flow-canvas-toolbar__divider" aria-hidden="true" />

      <button
        type="button"
        class="flow-canvas-toolbar__icon-btn"
        title="适应画布"
        aria-label="适应画布"
        @click="onFitView"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"
          />
        </svg>
      </button>

      <button
        type="button"
        class="flow-canvas-toolbar__icon-btn"
        :class="{ 'flow-canvas-toolbar__icon-btn--active': showMinimap }"
        :title="showMinimap ? '隐藏缩略图' : '显示缩略图'"
        :aria-label="showMinimap ? '隐藏缩略图' : '显示缩略图'"
        @click="onToggleMinimap"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            d="M4 7h11v11H4V7zm12 3h4v8h-4v-8z"
          />
          <path
            v-if="!showMinimap"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            d="M6 18L18 6"
          />
        </svg>
      </button>

      <button
        type="button"
        class="flow-canvas-toolbar__icon-btn"
        :class="{ 'flow-canvas-toolbar__icon-btn--active': locked }"
        title="锁定画布"
        aria-label="锁定画布"
        @click="onToggleLock"
      >
        <svg v-if="!locked" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h1zm2 0h6V8a3 3 0 0 0-6 0v2z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6 11h12v10H6V11zm2-3V8a4 4 0 0 1 8 0v2h-2V8a2 2 0 0 0-4 0v2H8z"
          />
        </svg>
      </button>

      <span class="flow-canvas-toolbar__divider" aria-hidden="true" />

      <button
        type="button"
        class="flow-canvas-toolbar__add-node"
        :class="{ 'flow-canvas-toolbar__add-node--active': leftMenuVisible && canEdit }"
        :disabled="!canEdit"
        :title="canEdit ? (leftMenuVisible ? '隐藏节点菜单' : '显示节点菜单') : '查看模式下不可添加节点'"
        :aria-label="canEdit ? (leftMenuVisible ? '隐藏节点菜单' : '显示节点菜单') : '查看模式下不可添加节点'"
        @click="onToggleLeftMenu"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
        </svg>
        <span>添加节点</span>
      </button>
    </div>

    <div class="flow-canvas-toolbar__group flow-canvas-toolbar__group--actions">
      <span
        class="flow-canvas-toolbar__mode"
        :class="`flow-canvas-toolbar__mode--${mode}`"
      >
        {{ modeLabel }}
      </span>
      <span class="flow-canvas-toolbar__flow-name" :title="flowTitle">
        {{ flowTitle }}
      </span>
      <span class="flow-canvas-toolbar__divider" aria-hidden="true" />
      <button
        type="button"
        class="flow-canvas-toolbar__save"
        :disabled="!canEdit"
        :title="canEdit ? '保存' : '查看模式下不可保存'"
        :aria-label="canEdit ? '保存' : '查看模式下不可保存'"
        @click="emit('save')"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14.06 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.83a2 2 0 0 0-.59-1.42L15.65 2.59A2 2 0 0 0 14.06 2zm0 2.83L18.17 7H15a1 1 0 0 1-1-1V4.83zM7 20V10h10v10H7zm2-8h6v2H9v-2z"
          />
        </svg>
        <span>保存</span>
      </button>
      <button
        type="button"
        class="flow-canvas-toolbar__run"
        :disabled="runLoading"
        @click="emit('run')"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path fill="currentColor" d="M8 5v14l11-7L8 5z" />
        </svg>
        <span>{{ runLoading ? '运行中…' : '试运行' }}</span>
      </button>
    </div>
  </div>
</template>
