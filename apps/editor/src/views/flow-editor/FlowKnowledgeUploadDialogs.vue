<script setup lang="ts">
import { Button, Checkbox, Message } from '@arco-design/web-vue'
import { saveAs } from 'file-saver'
import { computed, ref } from 'vue'
import { uploadQdrantDocumentApi, uploadQdrantQaFileApi } from '@flowgame/core'
import { FLOW_KNOWLEDGE_UPLOAD_TEMPLATE_TXT } from '../flow-knowledge/upload-template'

const props = defineProps<{
  getCollectionName: () => string
}>()

const emit = defineEmits<{
  txtUploaded: []
  docUploaded: []
}>()

const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

const txtVisible = ref(false)
const uploadLoading = ref(false)
const pendingTxtFile = ref<File | null>(null)

const docVisible = ref(false)
const docUploadLoading = ref(false)
const pendingDocFile = ref<File | null>(null)
const useHacrChunking = ref(false)

const pendingDocIsMarkdown = computed(() => {
  const name = (pendingDocFile.value?.name || '').toLowerCase()
  return name.endsWith('.md') || name.endsWith('.markdown')
})

const txtDragActive = ref(false)
const docDragActive = ref(false)
let txtDragDepth = 0
let docDragDepth = 0

function isTxtFile(file: File) {
  return (file.name || '').toLowerCase().endsWith('.txt')
}

function isDocumentFile(file: File) {
  const name = (file.name || '').toLowerCase()
  return name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.md') || name.endsWith('.markdown')
}

function assignTxtFile(file: File) {
  if (!isTxtFile(file)) {
    Message.warning('仅支持 .txt 文件')
    return
  }
  pendingTxtFile.value = file
}

function assignDocFile(file: File) {
  if (!isDocumentFile(file)) {
    Message.warning('仅支持 .pdf、.docx、.md 文件')
    return
  }
  pendingDocFile.value = file
  const name = (file.name || '').toLowerCase()
  if (!name.endsWith('.md') && !name.endsWith('.markdown'))
    useHacrChunking.value = false
}

function onTxtDragEnter(event: DragEvent) {
  event.preventDefault()
  txtDragDepth += 1
  txtDragActive.value = true
}

function onTxtDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'copy'
}

function onTxtDragLeave(event: DragEvent) {
  event.preventDefault()
  txtDragDepth = Math.max(0, txtDragDepth - 1)
  if (txtDragDepth === 0)
    txtDragActive.value = false
}

function onTxtDrop(event: DragEvent) {
  event.preventDefault()
  txtDragDepth = 0
  txtDragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file)
    assignTxtFile(file)
}

function onDocDragEnter(event: DragEvent) {
  event.preventDefault()
  docDragDepth += 1
  docDragActive.value = true
}

function onDocDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'copy'
}

function onDocDragLeave(event: DragEvent) {
  event.preventDefault()
  docDragDepth = Math.max(0, docDragDepth - 1)
  if (docDragDepth === 0)
    docDragActive.value = false
}

function onDocDrop(event: DragEvent) {
  event.preventDefault()
  docDragDepth = 0
  docDragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file)
    assignDocFile(file)
}

/** Firefox 在弹窗内点击 file input 常无响应；在用户手势里动态创建 body 上的 input 最稳妥 */
function pickFile(accept: string, onPick: (file: File) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = false
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    input.remove()
    if (file)
      onPick(file)
  }, { once: true })
  document.body.appendChild(input)
  input.click()
}

function openTxt() {
  pendingTxtFile.value = null
  docVisible.value = false
  txtVisible.value = true
}

function openDoc() {
  pendingDocFile.value = null
  useHacrChunking.value = false
  txtVisible.value = false
  docVisible.value = true
}

function closeTxt() {
  txtVisible.value = false
  pendingTxtFile.value = null
  txtDragActive.value = false
  txtDragDepth = 0
}

function closeDoc() {
  docVisible.value = false
  pendingDocFile.value = null
  useHacrChunking.value = false
  docDragActive.value = false
  docDragDepth = 0
}

function chooseTxtFile() {
  pickFile('.txt', assignTxtFile)
}

function chooseDocFile() {
  pickFile('.pdf,.docx,.md,.markdown', assignDocFile)
}

function clearTxtFile() {
  pendingTxtFile.value = null
}

function clearDocFile() {
  pendingDocFile.value = null
}

function downloadTemplate() {
  saveAs(new Blob([`\uFEFF${FLOW_KNOWLEDGE_UPLOAD_TEMPLATE_TXT}`], { type: 'text/plain;charset=utf-8' }), '知识库上传模板.txt')
}

async function confirmTxtUpload() {
  const collectionName = props.getCollectionName()
  if (!collectionName) {
    Message.warning('请先选择 Collection')
    return
  }
  if (!pendingTxtFile.value) {
    Message.warning('请选择文件')
    return
  }
  uploadLoading.value = true
  try {
    const res = await uploadQdrantQaFileApi(collectionName, pendingTxtFile.value)
    Message.success(`成功导入 ${res.data?.imported ?? 0} 条 Q&A`)
    closeTxt()
    emit('txtUploaded')
  }
  finally {
    uploadLoading.value = false
  }
}

async function confirmDocUpload() {
  const collectionName = props.getCollectionName()
  if (!collectionName) {
    Message.warning('请先选择 Collection')
    return
  }
  if (!pendingDocFile.value) {
    Message.warning('请选择文件')
    return
  }
  docUploadLoading.value = true
  try {
    const res = await uploadQdrantDocumentApi(collectionName, pendingDocFile.value, {
      useHacr: useHacrChunking.value,
    })
    const parentCount = res.data?.parentCount
    const chunkingVersion = res.data?.chunkingVersion
    const imported = res.data?.importedChunks ?? 0
    if (chunkingVersion === 'v2_llm_hacr' && parentCount != null && parentCount > 0) {
      Message.success(`智能分片完成：${parentCount} 个主题，${imported} 个检索块`)
    }
    else {
      Message.success(`成功导入 ${imported} 个文本块`)
    }
    closeDoc()
    emit('docUploaded')
  }
  finally {
    docUploadLoading.value = false
  }
}

function closeAll() {
  closeTxt()
  closeDoc()
}

defineExpose({
  openTxt,
  openDoc,
  closeAll
})
</script>

<template>
  <Teleport to="body">
    <div v-if="txtVisible" class="flow-kb-upload-overlay" role="dialog" aria-modal="true" aria-labelledby="flow-kb-upload-txt-title">
      <div class="flow-kb-upload-overlay__mask" @click="closeTxt" />
      <div class="flow-kb-upload-overlay__panel">
        <header id="flow-kb-upload-txt-title" class="flow-kb-upload-overlay__title">
          上传 Q&A 文档
        </header>
        <div class="flow-kb-upload-overlay__body">
          <p v-if="isFirefox" class="flow-kb-upload-overlay__firefox-tip">
            Firefox 提示：若「选择文件」无反应，请将文件拖入下方虚线区域上传。
          </p>
          <p class="flow-kb-upload-overlay__hint">
            仅支持 .txt，格式示例：每段以 <code>Q:</code> 开头、<code>A:</code> 回答，上传后自动 Embedding 写入当前 Collection。
          </p>
          <Button type="text" @click="downloadTemplate">
            下载模板
          </Button>
          <div
            class="flow-kb-upload-overlay__dropzone"
            :class="{ 'is-active': txtDragActive }"
            @dragenter="onTxtDragEnter"
            @dragover="onTxtDragOver"
            @dragleave="onTxtDragLeave"
            @drop="onTxtDrop"
          >
            <p class="flow-kb-upload-overlay__dropzone-title">
              或将 .txt 文件拖入此处
            </p>
            <p class="flow-kb-upload-overlay__dropzone-hint">
              拖入上传不依赖系统文件选择框，Firefox 下更稳定
            </p>
          </div>
          <div class="flow-kb-upload-overlay__file-row">
            <Button type="primary" @click="chooseTxtFile">
              选择文件
            </Button>
            <span v-if="pendingTxtFile" class="flow-kb-upload-overlay__file-name">{{ pendingTxtFile.name }}</span>
            <Button v-if="pendingTxtFile" type="text" status="danger" @click="clearTxtFile">
              移除
            </Button>
          </div>
        </div>
        <footer class="flow-kb-upload-overlay__footer">
          <Button @click="closeTxt">
            取消
          </Button>
          <Button type="primary" :loading="uploadLoading" @click="confirmTxtUpload">
            确定
          </Button>
        </footer>
      </div>
    </div>

    <div v-if="docVisible" class="flow-kb-upload-overlay" role="dialog" aria-modal="true" aria-labelledby="flow-kb-upload-doc-title">
      <div class="flow-kb-upload-overlay__mask" @click="closeDoc" />
      <div class="flow-kb-upload-overlay__panel">
        <header id="flow-kb-upload-doc-title" class="flow-kb-upload-overlay__title">
          上传 PDF / Word 文档
        </header>
        <div class="flow-kb-upload-overlay__body">
          <p v-if="isFirefox" class="flow-kb-upload-overlay__firefox-tip">
            Firefox 提示：若「选择文件」无反应，请将文件拖入下方虚线区域上传。
          </p>
          <p class="flow-kb-upload-overlay__hint">
            支持 .pdf、.docx、.md（单文件 ≤ 20MB）。上传后自动解析、分块并 Embedding 写入当前 Collection；扫描版 PDF 需含可选中文字。
          </p>
          <div
            class="flow-kb-upload-overlay__dropzone"
            :class="{ 'is-active': docDragActive }"
            @dragenter="onDocDragEnter"
            @dragover="onDocDragOver"
            @dragleave="onDocDragLeave"
            @drop="onDocDrop"
          >
            <p class="flow-kb-upload-overlay__dropzone-title">
              或将 .pdf / .docx / .md 文件拖入此处
            </p>
            <p class="flow-kb-upload-overlay__dropzone-hint">
              拖入上传不依赖系统文件选择框，Firefox 下更稳定
            </p>
          </div>
          <div class="flow-kb-upload-overlay__file-row">
            <Button type="primary" @click="chooseDocFile">
              选择文件
            </Button>
            <span v-if="pendingDocFile" class="flow-kb-upload-overlay__file-name">{{ pendingDocFile.name }}</span>
            <Button v-if="pendingDocFile" type="text" status="danger" @click="clearDocFile">
              移除
            </Button>
          </div>
          <div v-if="pendingDocIsMarkdown" class="flow-kb-upload-overlay__hacr-option">
            <Checkbox v-model="useHacrChunking">
              启用 HACR 智能分片（LLM 辅助，消耗 Token）
            </Checkbox>
            <p class="flow-kb-upload-overlay__hacr-hint">
              勾选后：LLM 通读整篇文档，自动划分主题（小块检索）并为每个主题保留对应原文（大块生成）。会消耗 Token；未勾选时使用经典 600 字分片。
            </p>
          </div>
        </div>
        <footer class="flow-kb-upload-overlay__footer">
          <Button @click="closeDoc">
            取消
          </Button>
          <Button type="primary" :loading="docUploadLoading" @click="confirmDocUpload">
            确定
          </Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
.flow-kb-upload-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
  }

  &__panel {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(520px, calc(100vw - 32px));
    transform: translate(-50%, -50%);
    border-radius: 8px;
    background: var(--color-bg-3);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  &__title {
    padding: 16px 20px;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text-1);
    border-bottom: 1px solid var(--color-border-2);
  }

  &__body {
    padding: 16px 20px;
  }

  &__firefox-tip {
    margin: 0 0 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: rgb(var(--orange-7));
    background: rgba(var(--orange-6), 0.12);
    border: 1px solid rgba(var(--orange-6), 0.25);
  }

  &__hint {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-3);
  }

  &__file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  &__hacr-option {
    margin-top: 16px;
    padding: 12px;
    border-radius: 8px;
    background: var(--color-fill-1);
    border: 1px solid var(--color-border-2);
  }

  &__hacr-hint {
    margin: 8px 0 0 24px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-text-3);
  }

  &__dropzone {
    margin-top: 12px;
    padding: 20px 16px;
    border: 1px dashed var(--color-border-3);
    border-radius: 8px;
    background: var(--color-fill-1);
    text-align: center;
    transition: border-color 0.15s ease, background-color 0.15s ease;

    &.is-active {
      border-color: rgb(var(--primary-6));
      background: rgba(var(--primary-6), 0.08);
    }
  }

  &__dropzone-title {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-1);
  }

  &__dropzone-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--color-text-3);
  }

  &__file-name {
    font-size: 13px;
    color: var(--color-text-2);
    word-break: break-all;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid var(--color-border-2);
  }
}
</style>
