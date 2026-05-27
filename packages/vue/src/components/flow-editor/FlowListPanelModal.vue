<script setup lang="ts">
import dayjs from 'dayjs'
import { reactive, ref, watch } from 'vue'
import {
  Button,
  Form,
  FormItem,
  Input,
  Link,
  Message,
  Modal,
  Pagination,
  Popconfirm,
  Space,
  Table,
  TableColumn
} from '@arco-design/web-vue'
import { deleteFlowApi, listFlowListApi, type FlowListIndexItem } from '@flowgame/core'
import type { FlowEditorFormMode } from '../../types'

const props = defineProps<{
  visible: boolean
  editorReadonly?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  open: [payload: { mode: FlowEditorFormMode, record?: FlowListIndexItem }]
}>()

const loading = ref(false)
const tableData = ref<FlowListIndexItem[]>([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 10 })
const params = reactive<{ name?: string }>({})

async function loadTable() {
  loading.value = true
  try {
    const ret = await listFlowListApi({ name: params.name?.trim() || undefined })
    total.value = ret.total
    const start = (pagination.current - 1) * pagination.pageSize
    tableData.value = ret.items.slice(start, start + pagination.pageSize)
  }
  finally {
    loading.value = false
  }
}

function handleOpen(type: FlowEditorFormMode, record?: FlowListIndexItem) {
  emit('open', { mode: type, record })
  emit('update:visible', false)
}

async function handleRemove(redisKey: string) {
  try {
    await deleteFlowApi(redisKey)
    Message.success('删除成功')
    await loadTable()
  }
  catch {
    // 错误由 flowgame 请求拦截器提示
  }
}

function handleSearch() {
  pagination.current = 1
  void loadTable()
}

function handleReset() {
  params.name = ''
  pagination.current = 1
  void loadTable()
}

function onPageChange(current: number) {
  pagination.current = current
  void loadTable()
}

function onPageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  void loadTable()
}

watch(() => props.visible, (open) => {
  if (open) {
    pagination.current = 1
    void loadTable()
  }
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

      <div v-if="!editorReadonly" class="flow-list-panel__toolbar">
        <Button type="primary" @click="handleOpen('add')">
          新建流程
        </Button>
      </div>

      <Table
        :data="tableData"
        :loading="loading"
        row-key="redisKey"
        :pagination="false"
        :scroll="{ x: 800 }"
      >
        <template #columns>
          <TableColumn title="流程名称" data-index="name" />
          <TableColumn title="Redis Key" data-index="redisKey" :width="280" ellipsis tooltip />
          <TableColumn title="更新时间" data-index="updatedAt" :width="170">
            <template #cell="{ record }">
              {{ record.updatedAt ? dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '--' }}
            </template>
          </TableColumn>
          <TableColumn title="操作" :width="editorReadonly ? 80 : 170" fixed="right">
            <template #cell="{ record }">
              <Space>
                <Link @click="handleOpen('view', record)">
                  查看
                </Link>
                <template v-if="!editorReadonly">
                  <Link @click="handleOpen('edit', record)">
                    编辑
                  </Link>
                  <Popconfirm content="确认删除该流程吗？" @ok="handleRemove(record.redisKey)">
                    <Link status="danger">
                      删除
                    </Link>
                  </Popconfirm>
                </template>
              </Space>
            </template>
          </TableColumn>
        </template>
      </Table>

      <div class="flow-list-panel__pagination">
        <Pagination
          :total="total"
          :current="pagination.current"
          :page-size="pagination.pageSize"
          show-total
          show-page-size
          @change="onPageChange"
          @page-size-change="onPageSizeChange"
        />
      </div>
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

  &__reset-btn {
    margin-left: 8px;
  }

  &__toolbar {
    margin-bottom: 12px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

:global(.flow-list-panel-modal .arco-modal-body) {
  max-height: min(70vh, 640px);
  overflow: auto;
}
</style>
