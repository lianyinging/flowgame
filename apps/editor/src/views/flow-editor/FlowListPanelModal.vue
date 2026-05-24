<script setup lang="tsx">
import dayjs from 'dayjs'
import { Button, Form, FormItem, Input, Link, Message, Modal, Popconfirm } from '@arco-design/web-vue'
import { reactive, ref, watch } from 'vue'
import { ProTable, type TableProColumn } from '@/components/ProComponent'
import { deleteFlowApi, listFlowListApi, type FlowListIndexItem } from '@flowgame/core'
import type { IFormType } from '@/api/types'

const props = defineProps<{
  visible: boolean
  editorReadonly?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  open: [payload: { mode: IFormType, record?: FlowListIndexItem }]
}>()

const tableRef = ref<InstanceType<typeof ProTable>>()
const params = reactive<{ name?: string }>({})

const columns: TableProColumn[] = [
  {
    dataIndex: 'name',
    title: '流程名称',
    hideInSearch: true
  },
  {
    dataIndex: 'redisKey',
    title: 'Redis Key',
    hideInSearch: true,
    ellipsis: true,
    tooltip: true,
    width: 280
  },
  {
    dataIndex: 'updatedAt',
    title: '更新时间',
    hideInSearch: true,
    width: 170,
    renderCell: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '--')
  },
  {
    dataIndex: 'action',
    title: '操作',
    hideInSearch: true,
    fixed: 'right',
    width: props.editorReadonly ? 80 : 170,
    renderTableItem: (record: FlowListIndexItem) => (
      <div>
        <Link onClick={(e: Event) => { e.preventDefault(); handleOpen('view', record) }}>查看</Link>
        {!props.editorReadonly && (
          <>
            <Link onClick={(e: Event) => { e.preventDefault(); handleOpen('edit', record) }}>编辑</Link>
            <Popconfirm content="确认删除该流程吗？" onOk={() => handleRemove(record.redisKey)}>
              <Link status="danger">删除</Link>
            </Popconfirm>
          </>
        )}
      </div>
    )
  }
]

async function fetchData(args: Record<string, unknown>) {
  const current = Number(args.current ?? args.pageNum ?? 1)
  const pageSize = Number(args.pageSize ?? 10)
  const name = typeof args.name === 'string' ? args.name : undefined
  const ret = await listFlowListApi({ name })
  const start = (current - 1) * pageSize
  const list = ret.items.slice(start, start + pageSize)
  return {
    list,
    total: ret.total
  }
}

function handleOpen(type: IFormType, record?: FlowListIndexItem) {
  emit('open', { mode: type, record })
  emit('update:visible', false)
}

async function handleRemove(redisKey: string) {
  try {
    await deleteFlowApi(redisKey)
    Message.success('删除成功')
    tableRef.value?.reload()
  }
  catch {
    // 错误由 flowgame 请求拦截器提示
  }
}

function syncSearchToTable() {
  tableRef.value?.setTableParams({ name: params.name ?? '' })
}

function handleSearch() {
  syncSearchToTable()
  tableRef.value?.reload()
}

function handleReset() {
  params.name = ''
  syncSearchToTable()
  tableRef.value?.reload()
}

const renderTools = () => (
  !props.editorReadonly
    ? (
        <Button type="primary" onClick={() => handleOpen('add')}>
          新建流程
        </Button>
      )
    : null
)

watch(() => props.visible, (open) => {
  if (open)
    tableRef.value?.reload()
})
</script>

<template>
  <Modal
    :visible="visible"
    title="流程列表"
    :width="920"
    :footer="false"
    unmount-on-close
    align-center
    modal-class="flow-list-panel-modal"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flow-list-panel">
      <Form class="flow-list-panel__search" :model="params" layout="inline">
        <FormItem label="流程名称" field="name">
          <Input
            v-model="params.name"
            class="flow-list-panel__search-input"
            :style="{ width: '200px' }"
            placeholder="请输入流程名称"
            allow-clear
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem hide-label>
          <Button type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button class="flow-list-panel__reset-btn" @click="handleReset">
            重置
          </Button>
        </FormItem>
      </Form>

      <ProTable
        ref="tableRef"
        row-key="redisKey"
        hide-search-form
        :params="params"
        :columns="columns"
        :request="fetchData"
        :render-toolbar="renderTools"
      />
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.flow-list-panel {
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

.flow-list-panel-modal {
  :deep(.arco-modal-body) {
    max-height: min(70vh, 640px);
    overflow: auto;
  }
}
</style>
