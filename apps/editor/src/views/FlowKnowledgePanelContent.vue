<script setup lang="tsx">
import { onMounted, reactive, ref, watch } from 'vue'
import type { FileItem } from '@arco-design/web-vue'
import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Link,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  TabPane,
  Tabs,
  Upload
} from '@arco-design/web-vue'
import { saveAs } from 'file-saver'
import { ProTable, type TableProColumn } from '@/components/ProComponent'
import useSelection from '@/hooks/useSelection'
import {
  createKbPairApi,
  createQdrantQaPointApi,
  deleteKbPairApi,
  deleteQdrantPointsApi,
  invalidateKbBasesCache,
  listKbBasesCached,
  scrollQdrantPointsApi,
  updateQdrantQaPointApi,
  deleteQdrantKbDocumentApi,
  listQdrantKbDocumentsApi,
  uploadQdrantDocumentApi,
  uploadQdrantQaFileApi,
  type QdrantKbDocumentItem
} from '@flowgame/core'
import {
  FLOWGAME_KB_PREFIX,
  KB_DOC_SUFFIX,
  KB_QA_SUFFIX,
  displayKbBaseName,
  isKbBaseNameInput,
  normalizeKbBaseName
} from '@flowgame/core'
import { FLOW_KNOWLEDGE_UPLOAD_TEMPLATE_TXT } from './flow-knowledge/upload-template'

type KbBaseRow = {
  collectionName: string
  baseName: string
  qaCollection: string
  docCollection: string
  qaPointsCount?: number
  docPointsCount?: number
  status?: string
}

const props = defineProps<{
  /** 为 true 时刷新 Collection 列表（弹窗打开时传入） */
  active?: boolean
}>()

const activeTab = ref('collections')
const collectionOptions = ref<KbBaseRow[]>([])
const selectedCollection = ref('')

const collectionTableRef = ref<InstanceType<typeof ProTable>>()
const pointTableRef = ref<InstanceType<typeof ProTable>>()
const docTableRef = ref<InstanceType<typeof ProTable>>()
const collectionParams = reactive<{ name?: string }>({})
const pointParams = reactive<{ keyword?: string }>({})
const docParams = reactive<{ fileName?: string }>({})

const { selectedKeys, setSelectedKeys, selectionConfig } = useSelection()

const createCollectionVisible = ref(false)
const createCollectionLoading = ref(false)
const createCollectionForm = reactive({
  collectionName: '',
  vectorSize: 512,
  distance: 'Cosine'
})

const pointFormVisible = ref(false)
const pointFormLoading = ref(false)
const pointFormType = ref<'add' | 'edit'>('add')
const pointForm = reactive({
  pointId: '' as string | number | '',
  question: '',
  answer: ''
})

const uploadVisible = ref(false)
const uploadLoading = ref(false)
const pendingTxtFile = ref<File | null>(null)
const txtUploadFileList = ref<FileItem[]>([])

const docUploadVisible = ref(false)
const docUploadLoading = ref(false)
const pendingDocFile = ref<File | null>(null)
const docUploadFileList = ref<FileItem[]>([])

const distanceOptions = [
  { label: 'Cosine', value: 'Cosine' },
  { label: 'Euclid', value: 'Euclid' },
  { label: 'Dot', value: 'Dot' }
]

function mapKbBasesToRows(bases: Array<{
  baseName: string
  qaCollection?: string
  docCollection?: string
  qaPointsCount?: number
  docPointsCount?: number
  status?: string
}>): KbBaseRow[] {
  return bases.map(b => ({
    collectionName: b.baseName,
    baseName: b.baseName,
    qaCollection: b.qaCollection ?? `${FLOWGAME_KB_PREFIX}${b.baseName}${KB_QA_SUFFIX}`,
    docCollection: b.docCollection ?? `${FLOWGAME_KB_PREFIX}${b.baseName}${KB_DOC_SUFFIX}`,
    qaPointsCount: b.qaPointsCount,
    docPointsCount: b.docPointsCount,
    status: b.status
  }))
}

function getSelectedKbRow() {
  return collectionOptions.value.find(c => c.baseName === selectedCollection.value)
}

function getSelectedQaCollection() {
  return getSelectedKbRow()?.qaCollection ?? selectedCollection.value
}

function applyCollectionList(list: KbBaseRow[]) {
  collectionOptions.value = list
  if (!list.length) {
    selectedCollection.value = ''
    return
  }
  if (!selectedCollection.value || !list.some(c => c.baseName === selectedCollection.value))
    selectedCollection.value = list[0].baseName
}

async function refreshCollectionOptions(force = false) {
  try {
    const bases = await listKbBasesCached(force)
    applyCollectionList(mapKbBasesToRows(bases))
  }
  catch {
    collectionOptions.value = []
    selectedCollection.value = ''
  }
}

function extractAnswer(pageContent?: string) {
  const text = (pageContent ?? '').trim()
  if (!text)
    return ''
  const match = text.match(/回答\s*[:：]\s*([\s\S]+)/)
  return (match?.[1] ?? text).trim()
}

async function fetchCollections(args: Record<string, unknown>) {
  const all = mapKbBasesToRows(await listKbBasesCached())
  let list = all
  const keyword = String(args.name ?? '').trim()
  if (keyword)
    list = list.filter(item => item.baseName.includes(keyword))
  const current = Number(args.current ?? args.pageNum ?? 1)
  const pageSize = Number(args.pageSize ?? 10)
  const start = (current - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length
  }
}

async function fetchPoints(args: Record<string, unknown>) {
  setSelectedKeys([])
  const collectionName = selectedCollection.value
  if (!collectionName)
    return { list: [], total: 0 }

  const current = Number(args.current ?? args.pageNum ?? 1)
  const pageSize = Number(args.pageSize ?? 10)
  const limit = Math.min(200, pageSize * current + pageSize)
  const res = await scrollQdrantPointsApi({ collectionName: getSelectedQaCollection(), limit })
  let points = res.data?.points ?? []
  const keyword = String(args.keyword ?? '').trim().toLowerCase()
  if (keyword) {
    points = points.filter((p) => {
      const q = String(p.payload?.metadata?.question ?? '').toLowerCase()
      const a = extractAnswer(p.payload?.page_content).toLowerCase()
      return q.includes(keyword) || a.includes(keyword)
    })
  }
  const start = (current - 1) * pageSize
  const list = points.slice(start, start + pageSize).map(p => ({
    id: p.id,
    question: p.payload?.metadata?.question ?? '--',
    answer: extractAnswer(p.payload?.page_content) || p.payload?.metadata?.answer || '--'
  }))
  return { list, total: points.length }
}

async function handleCreateCollection() {
  const name = createCollectionForm.collectionName.trim()
  if (!name) {
    Message.warning('请输入知识库名称')
    return false
  }
  if (!isKbBaseNameInput(name)) {
    Message.warning('名称须以中文、字母或数字开头，勿含 flowgame_ 前缀或 _qa/_doc 后缀')
    return false
  }
  createCollectionLoading.value = true
  try {
    const base = normalizeKbBaseName(name)
    const res = await createKbPairApi({
      collectionName: base,
      vectorSize: createCollectionForm.vectorSize,
      distance: createCollectionForm.distance
    })
    Message.success(`已创建知识库「${res.data?.baseName ?? normalizeKbBaseName(name)}」`)
    createCollectionVisible.value = false
    createCollectionForm.collectionName = ''
    invalidateKbBasesCache()
    await refreshCollectionOptions(true)
    selectedCollection.value = base
    collectionTableRef.value?.reload()
    return true
  }
  catch {
    return false
  }
  finally {
    createCollectionLoading.value = false
  }
}

async function handleDeleteCollection(record: KbBaseRow) {
  await deleteKbPairApi(record.baseName)
  Message.success('删除成功')
  invalidateKbBasesCache()
  await refreshCollectionOptions(true)
  if (selectedCollection.value === record.baseName)
    selectedCollection.value = collectionOptions.value[0]?.baseName ?? ''
  collectionTableRef.value?.reload()
  pointTableRef.value?.reload()
}

function openPointForm(type: 'add' | 'edit', record?: { id: string | number, question?: string, answer?: string }) {
  pointFormType.value = type
  pointForm.pointId = type === 'edit' && record ? record.id : ''
  pointForm.question = record?.question && record.question !== '--' ? String(record.question) : ''
  pointForm.answer = record?.answer && record.answer !== '--' ? String(record.answer) : ''
  pointFormVisible.value = true
}

async function submitPointForm() {
  const collectionName = selectedCollection.value
  if (!collectionName) {
    Message.warning('请先选择 Collection')
    return false
  }
  if (!pointForm.question.trim() || !pointForm.answer.trim()) {
    Message.warning('请填写问题和回答')
    return false
  }
  pointFormLoading.value = true
  try {
    if (pointFormType.value === 'add') {
      await createQdrantQaPointApi({
        collectionName,
        question: pointForm.question.trim(),
        answer: pointForm.answer.trim()
      })
    }
    else {
      await updateQdrantQaPointApi({
        collectionName,
        pointId: pointForm.pointId,
        question: pointForm.question.trim(),
        answer: pointForm.answer.trim()
      })
    }
    Message.success('保存成功')
    pointFormVisible.value = false
    pointTableRef.value?.reload()
    return true
  }
  catch {
    return false
  }
  finally {
    pointFormLoading.value = false
  }
}

async function handleDeletePoint(record: { id: string | number }) {
  if (!selectedCollection.value)
    return
  await deleteQdrantPointsApi({
    collectionName: selectedCollection.value,
    pointIds: [record.id]
  })
  Message.success('删除成功')
  pointTableRef.value?.reload()
}

function handleBatchDeletePoints() {
  if (!selectedKeys.value.length || !selectedCollection.value)
    return
  Modal.confirm({
    title: '批量删除',
    content: `确定删除已选中的 ${selectedKeys.value.length} 条 Q&A 吗？`,
    onBeforeOk: async () => {
      await deleteQdrantPointsApi({
        collectionName: selectedCollection.value,
        pointIds: [...selectedKeys.value]
      })
      Message.success('删除成功')
      setSelectedKeys([])
      pointTableRef.value?.reload()
      return true
    }
  })
}

function isTxtFile(file: File) {
  return (file.name || '').toLowerCase().endsWith('.txt')
}

function handleSelectTxt(option: any) {
  const file = option?.fileItem?.file as File | undefined
  if (!file || !isTxtFile(file)) {
    Message.warning('仅支持 .txt 文件')
    option?.onError?.()
    return { abort: () => {} }
  }
  pendingTxtFile.value = file
  txtUploadFileList.value = [{ uid: String(Date.now()), name: file.name, status: 'done' } as FileItem]
  option?.onSuccess?.()
  return { abort: () => {} }
}

async function fetchDocuments(args: Record<string, unknown>) {
  const collectionName = selectedCollection.value
  if (!collectionName)
    return { list: [], total: 0 }

  const res = await listQdrantKbDocumentsApi(collectionName)
  let list = res.data?.documents ?? []
  const keyword = String(args.fileName ?? '').trim().toLowerCase()
  if (keyword)
    list = list.filter(item => String(item.fileName ?? '').toLowerCase().includes(keyword))

  const current = Number(args.current ?? args.pageNum ?? 1)
  const pageSize = Number(args.pageSize ?? 10)
  const start = (current - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length
  }
}

function isDocumentFile(file: File) {
  const name = (file.name || '').toLowerCase()
  return name.endsWith('.pdf') || name.endsWith('.docx')
}

function handleSelectDoc(option: any) {
  const file = option?.fileItem?.file as File | undefined
  if (!file || !isDocumentFile(file)) {
    Message.warning('仅支持 .pdf、.docx 文件')
    option?.onError?.()
    return { abort: () => {} }
  }
  pendingDocFile.value = file
  docUploadFileList.value = [{ uid: String(Date.now()), name: file.name, status: 'done' } as FileItem]
  option?.onSuccess?.()
  return { abort: () => {} }
}

async function confirmDocUpload() {
  if (!selectedCollection.value) {
    Message.warning('请先选择 Collection')
    return false
  }
  if (!pendingDocFile.value) {
    Message.warning('请选择文件')
    return false
  }
  docUploadLoading.value = true
  try {
    const res = await uploadQdrantDocumentApi(selectedCollection.value, pendingDocFile.value)
    Message.success(`成功导入 ${res.data?.importedChunks ?? 0} 个文本块`)
    docUploadVisible.value = false
    pendingDocFile.value = null
    docUploadFileList.value = []
    docTableRef.value?.reload()
    return true
  }
  catch {
    return false
  }
  finally {
    docUploadLoading.value = false
  }
}

async function handleDeleteDocument(record: QdrantKbDocumentItem) {
  if (!selectedCollection.value)
    return
  await deleteQdrantKbDocumentApi(selectedCollection.value, record.docId)
  Message.success('删除成功')
  docTableRef.value?.reload()
}

function onSelectCollectionForDocs(name: string) {
  selectedCollection.value = name
  activeTab.value = 'documents'
  docTableRef.value?.reload()
}

async function confirmUpload() {
  if (!selectedCollection.value) {
    Message.warning('请先选择 Collection')
    return false
  }
  if (!pendingTxtFile.value) {
    Message.warning('请选择文件')
    return false
  }
  uploadLoading.value = true
  try {
    const res = await uploadQdrantQaFileApi(selectedCollection.value, pendingTxtFile.value)
    Message.success(`成功导入 ${res.data?.imported ?? 0} 条 Q&A`)
    uploadVisible.value = false
    pendingTxtFile.value = null
    txtUploadFileList.value = []
    pointTableRef.value?.reload()
    return true
  }
  catch {
    return false
  }
  finally {
    uploadLoading.value = false
  }
}

function downloadTemplate() {
  saveAs(new Blob([`\uFEFF${FLOW_KNOWLEDGE_UPLOAD_TEMPLATE_TXT}`], { type: 'text/plain;charset=utf-8' }), '知识库上传模板.txt')
}

function onSelectCollection(name: string) {
  selectedCollection.value = name
  activeTab.value = 'points'
  pointTableRef.value?.reload()
}

const collectionColumns: TableProColumn[] = [
  {
    dataIndex: 'baseName',
    title: '知识库名称',
    hideInSearch: true,
    ellipsis: true,
    renderTableItem: (record: KbBaseRow) => (
      <span>{displayKbBaseName(record.baseName)}</span>
    )
  },
  { dataIndex: 'qaPointsCount', title: 'Q&A 条数', hideInSearch: true, width: 100 },
  { dataIndex: 'docPointsCount', title: '文档块数', hideInSearch: true, width: 100 },
  {
    dataIndex: 'action',
    title: '操作',
    width: 220,
    hideInSearch: true,
    renderTableItem: (record: KbBaseRow) => (
      <Space>
        <Link onClick={() => onSelectCollection(record.baseName)}>管理 Q&A</Link>
        <Link onClick={() => onSelectCollectionForDocs(record.baseName)}>管理文档</Link>
        <Popconfirm content={`确认删除知识库「${record.baseName}」及其 Q&A/文档 Collection？`} onOk={() => handleDeleteCollection(record)}>
          <Link status="danger">删除</Link>
        </Popconfirm>
      </Space>
    )
  }
]

const docColumns: TableProColumn[] = [
  { dataIndex: 'docId', title: '文档 ID', width: 280, ellipsis: true, hideInSearch: true },
  { dataIndex: 'fileName', title: '文件名', ellipsis: true, hideInSearch: true },
  { dataIndex: 'chunkCount', title: '文本块数', width: 100, hideInSearch: true },
  {
    dataIndex: 'createdAt',
    title: '上传时间',
    width: 200,
    hideInSearch: true,
    renderTableItem: (record: QdrantKbDocumentItem) => (
      <span>{record.createdAt ? new Date(record.createdAt).toLocaleString() : '--'}</span>
    )
  },
  {
    dataIndex: 'action',
    title: '操作',
    width: 100,
    hideInSearch: true,
    renderTableItem: (record: QdrantKbDocumentItem) => (
      <Popconfirm content={`确认删除文档「${record.fileName}」及其全部向量块？`} onOk={() => handleDeleteDocument(record)}>
        <Link status="danger">删除</Link>
      </Popconfirm>
    )
  }
]

const pointColumns: TableProColumn[] = [
  { dataIndex: 'keyword', title: '关键词', hideInTable: true, hideInSearch: true },
  { dataIndex: 'id', title: 'ID', width: 140, ellipsis: true, hideInSearch: true },
  { dataIndex: 'question', title: '问题', ellipsis: true, hideInSearch: true },
  { dataIndex: 'answer', title: '回答', ellipsis: true, hideInSearch: true },
  {
    dataIndex: 'action',
    title: '操作',
    width: 140,
    hideInSearch: true,
    renderTableItem: (record: { id: string | number, question: string, answer: string }) => (
      <Space>
        <Link onClick={() => openPointForm('edit', record)}>编辑</Link>
        <Popconfirm content="确认删除该条 Q&A？" onOk={() => handleDeletePoint(record)}>
          <Link status="danger">删除</Link>
        </Popconfirm>
      </Space>
    )
  }
]

const renderCollectionTools = () => (
  <Button type="primary" onClick={() => { createCollectionVisible.value = true }}>
    新建知识库
  </Button>
)

const renderDocTools = () => (
  <Button type="primary" disabled={!selectedCollection.value} onClick={() => { docUploadVisible.value = true }}>
    上传文档
  </Button>
)

const renderPointTools = () => (
  <Space>
    <Button type="primary" disabled={!selectedCollection.value} onClick={() => openPointForm('add')}>
      新增 Q&A
    </Button>
    <Button disabled={!selectedCollection.value} onClick={() => { uploadVisible.value = true }}>
      上传 Q&A 文档
    </Button>
    <Button disabled={!selectedKeys.value.length} status="danger" onClick={handleBatchDeletePoints}>
      批量删除
    </Button>
  </Space>
)

function syncCollectionSearchToTable() {
  collectionTableRef.value?.setTableParams({ name: collectionParams.name ?? '' })
}

function handleCollectionSearch() {
  syncCollectionSearchToTable()
  collectionTableRef.value?.reload()
}

function handleCollectionReset() {
  collectionParams.name = ''
  syncCollectionSearchToTable()
  collectionTableRef.value?.reload()
}

function syncDocSearchToTable() {
  docTableRef.value?.setTableParams({ fileName: docParams.fileName ?? '' })
}

function handleDocSearch() {
  syncDocSearchToTable()
  docTableRef.value?.reload()
}

function handleDocReset() {
  docParams.fileName = ''
  syncDocSearchToTable()
  docTableRef.value?.reload()
}

function syncPointSearchToTable() {
  pointTableRef.value?.setTableParams({ keyword: pointParams.keyword ?? '' })
}

function handlePointSearch() {
  syncPointSearchToTable()
  pointTableRef.value?.reload()
}

function handlePointReset() {
  pointParams.keyword = ''
  syncPointSearchToTable()
  pointTableRef.value?.reload()
}

function reloadTables() {
  collectionTableRef.value?.reload()
  pointTableRef.value?.reload()
  docTableRef.value?.reload()
}

defineExpose({
  refresh: refreshCollectionOptions,
  reloadTables
})

onMounted(() => {
  void refreshCollectionOptions()
})

watch(() => props.active, (open) => {
  if (open)
    void refreshCollectionOptions().then(() => reloadTables())
})
</script>

<template>
  <div class="flow-knowledge-panel">
    <Tabs v-model:active-key="activeTab">
      <TabPane key="collections" title="知识库管理">
        <Form class="flow-knowledge-panel__search" :model="collectionParams" layout="inline">
          <FormItem label="知识库名称" field="name">
            <Input
              v-model="collectionParams.name"
              class="flow-knowledge-panel__search-input"
              :style="{ width: '480px' }"
              placeholder="请输入知识库名称"
              allow-clear
              @press-enter="handleCollectionSearch"
            />
          </FormItem>
          <FormItem hide-label>
            <Button type="primary" @click="handleCollectionSearch">
              搜索
            </Button>
            <Button class="flow-knowledge-panel__reset-btn" @click="handleCollectionReset">
              重置
            </Button>
          </FormItem>
        </Form>
        <ProTable
          ref="collectionTableRef"
          row-key="baseName"
          hide-search-form
          :params="collectionParams"
          :columns="collectionColumns"
          :request="fetchCollections"
          :render-toolbar="renderCollectionTools"
        />
      </TabPane>
      <TabPane key="points" title="Q&A 数据">
        <Form class="flow-knowledge-panel__search" :model="pointParams" layout="inline">
          <FormItem label="关键词" field="keyword">
            <Input
              v-model="pointParams.keyword"
              class="flow-knowledge-panel__search-input"
              :style="{ width: '480px' }"
              placeholder="搜索问题或回答"
              allow-clear
              @press-enter="handlePointSearch"
            />
          </FormItem>
          <FormItem hide-label>
            <Button type="primary" @click="handlePointSearch">
              搜索
            </Button>
            <Button class="flow-knowledge-panel__reset-btn" @click="handlePointReset">
              重置
            </Button>
          </FormItem>
        </Form>
        <div class="flow-knowledge__toolbar">
          <span>当前知识库：</span>
          <Select
            v-model="selectedCollection"
            :options="collectionOptions.map(c => ({ label: displayKbBaseName(c.baseName), value: c.baseName }))"
            placeholder="请选择知识库"
            allow-search
            style="width: 280px"
            @change="pointTableRef?.reload()"
          />
        </div>
        <ProTable
          ref="pointTableRef"
          row-key="id"
          hide-search-form
          :params="pointParams"
          :columns="pointColumns"
          :request="fetchPoints"
          :selected-keys="selectedKeys"
          :row-selection="selectionConfig"
          :render-toolbar="renderPointTools"
          @selection-change="setSelectedKeys"
        />
      </TabPane>
      <TabPane key="documents" title="文档库">
        <Form class="flow-knowledge-panel__search" :model="docParams" layout="inline">
          <FormItem label="文件名" field="fileName">
            <Input
              v-model="docParams.fileName"
              class="flow-knowledge-panel__search-input"
              :style="{ width: '480px' }"
              placeholder="搜索文件名"
              allow-clear
              @press-enter="handleDocSearch"
            />
          </FormItem>
          <FormItem hide-label>
            <Button type="primary" @click="handleDocSearch">
              搜索
            </Button>
            <Button class="flow-knowledge-panel__reset-btn" @click="handleDocReset">
              重置
            </Button>
          </FormItem>
        </Form>
        <div class="flow-knowledge__toolbar">
          <span>当前知识库：</span>
          <Select
            v-model="selectedCollection"
            :options="collectionOptions.map(c => ({ label: displayKbBaseName(c.baseName), value: c.baseName }))"
            placeholder="请选择知识库"
            allow-search
            style="width: 280px"
            @change="docTableRef?.reload()"
          />
        </div>
        <ProTable
          ref="docTableRef"
          row-key="docId"
          hide-search-form
          :params="docParams"
          :columns="docColumns"
          :request="fetchDocuments"
          :render-toolbar="renderDocTools"
        />
      </TabPane>
    </Tabs>

    <Modal
      v-model:visible="createCollectionVisible"
      title="新建知识库"
      :ok-loading="createCollectionLoading"
      @before-ok="handleCreateCollection"
    >
      <Form :model="createCollectionForm" layout="vertical">
        <FormItem label="知识库名称" required>
          <Input
            v-model="createCollectionForm.collectionName"
            placeholder="如：日常问题"
            allow-clear
          />
          <p
            v-if="createCollectionForm.collectionName.trim() && isKbBaseNameInput(createCollectionForm.collectionName)"
            class="flow-knowledge__hint"
          >
            将创建知识库「{{ displayKbBaseName(createCollectionForm.collectionName) }}」（含 Q&A 与文档）
          </p>
        </FormItem>
        <FormItem label="向量维度">
          <InputNumber v-model="createCollectionForm.vectorSize" :min="1" :max="4096" style="width: 100%" />
        </FormItem>
        <FormItem label="距离度量">
          <Select v-model="createCollectionForm.distance" :options="distanceOptions" />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:visible="pointFormVisible"
      :title="pointFormType === 'add' ? '新增 Q&A' : '编辑 Q&A'"
      :ok-loading="pointFormLoading"
      @before-ok="submitPointForm"
    >
      <Form :model="pointForm" layout="vertical">
        <FormItem label="问题" required>
          <Input v-model="pointForm.question" placeholder="问题内容" allow-clear />
        </FormItem>
        <FormItem label="回答" required>
          <Input v-model="pointForm.answer" type="textarea" :auto-size="{ minRows: 3 }" placeholder="回答内容" />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:visible="docUploadVisible"
      title="上传 PDF / Word 文档"
      :ok-loading="docUploadLoading"
      @before-ok="confirmDocUpload"
    >
      <p class="flow-knowledge__hint">
        支持 .pdf、.docx（单文件 ≤ 20MB）。上传后自动解析、分块并 Embedding 写入当前 Collection；扫描版 PDF 需含可选中文字。
      </p>
      <Upload
        :file-list="docUploadFileList"
        accept=".pdf,.docx"
        :limit="1"
        :custom-request="handleSelectDoc"
        @remove="pendingDocFile = null; docUploadFileList = []"
      />
    </Modal>

    <Modal
      v-model:visible="uploadVisible"
      title="上传 Q&A 文档"
      :ok-loading="uploadLoading"
      @before-ok="confirmUpload"
    >
      <p class="flow-knowledge__hint">
        仅支持 .txt，格式示例：每段以 <code>Q:</code> 开头、<code>A:</code> 回答，上传后自动 Embedding 写入当前 Collection。
      </p>
      <Button type="text" @click="downloadTemplate">
        下载模板
      </Button>
      <Upload
        :file-list="txtUploadFileList"
        accept=".txt"
        :limit="1"
        :custom-request="handleSelectTxt"
        @remove="pendingTxtFile = null; txtUploadFileList = []"
      />
    </Modal>
  </div>
</template>

<style lang="scss" scoped>
.flow-knowledge-panel {
  width: 100%;

  &__search {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border-2);
  }

  &__search-input {
    width: 480px;
  }

  &__reset-btn {
    margin-left: 8px;
  }
}

.flow-knowledge__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.flow-knowledge__hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-3);
}
</style>
