<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Link,
  Message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  TableColumn,
  Typography
} from '@arco-design/web-vue'
import {
  deleteSessionRobotApi,
  getSessionRobotDefaultsApi,
  listFlowListApi,
  listSessionRobotsApi,
  saveSessionRobotApi,
  startSessionRobotApi,
  stopSessionRobotApi,
  type RobotFieldMapping,
  type SessionRobot,
  type SessionRobotType,
  type SessionRobotWorkerStatus
} from '@flowgame/core'

const props = defineProps<{
  visible: boolean
  editorReadonly?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const allRobots = ref<SessionRobot[]>([])
const tableData = ref<SessionRobot[]>([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 10 })
const params = reactive<{ keyword?: string }>({})
const workerInfo = ref<SessionRobotWorkerStatus | null>(null)
const flowOptions = ref<{ label: string, value: string }[]>([])
const typeOptions = ref<{ label: string, value: SessionRobotType }[]>([
  { label: '企业微信智能机器人', value: 'wecom_aibot' }
])

const editVisible = ref(false)
const editMode = ref<'add' | 'edit'>('add')
const saving = ref(false)
const actionLoadingId = ref('')

const editForm = reactive({
  robotId: '',
  name: '',
  type: 'wecom_aibot' as SessionRobotType,
  botId: '',
  secret: '',
  methodKey: '',
  /** 空 / undefined 表示未配置，走全局默认 */
  executeTimeoutSec: undefined as number | undefined,
  inputMapping: [] as RobotFieldMapping[],
  outputMapping: [] as RobotFieldMapping[]
})

const defaultInput = ref<RobotFieldMapping[]>([])
const defaultOutput = ref<RobotFieldMapping[]>([])
const defaultExecuteTimeoutSec = ref(120)

const outputTargetOptions = [
  { label: 'reply_markdown（回发）', value: 'reply_markdown' },
  { label: 'reply_text（回发）', value: 'reply_text' },
  { label: 'reply_file（回发文件）', value: 'reply_file' }
]

const statusLabel = (status: string) => {
  if (status === 'running')
    return '运行中'
  if (status === 'connecting')
    return '连接中'
  if (status === 'offline')
    return 'Worker 离线'
  if (status === 'error')
    return '异常'
  return '已停用'
}

const typeLabel = (type: string) =>
  typeOptions.value.find(t => t.value === type)?.label || type

const readonlyHint = computed(() => props.editorReadonly)

async function loadDefaults() {
  try {
    const d = await getSessionRobotDefaultsApi()
    if (d.types?.length)
      typeOptions.value = d.types
    defaultInput.value = d.inputMapping || []
    defaultOutput.value = d.outputMapping || []
    if (d.defaultExecuteTimeoutSec && d.defaultExecuteTimeoutSec > 0)
      defaultExecuteTimeoutSec.value = d.defaultExecuteTimeoutSec
  }
  catch {
    defaultInput.value = [
      { source: 'text', target: 'message' },
      { source: 'target', target: 'chatId' },
      { source: 'userid', target: 'userId' },
      { source: 'chattype', target: 'chatType' }
    ]
    defaultOutput.value = [{ source: 'assistantMessage', target: 'reply_markdown' }]
  }
}

async function loadFlows() {
  try {
    const res = await listFlowListApi()
    flowOptions.value = (res.items || []).map(item => ({
      label: item.name || item.redisKey,
      value: item.name
    })).filter(o => o.value)
  }
  catch {
    flowOptions.value = []
  }
}

function applyFilterAndPage() {
  const keyword = (params.keyword || '').trim().toLowerCase()
  let filtered = [...allRobots.value]
  if (keyword) {
    filtered = filtered.filter((r) => {
      const hay = [
        r.name,
        r.robotId,
        r.methodKey,
        r.botId,
        typeLabel(r.type),
        statusLabel(r.status),
        r.statusMessage || ''
      ].join(' ').toLowerCase()
      return hay.includes(keyword)
    })
  }
  total.value = filtered.length
  const maxPage = Math.max(1, Math.ceil(filtered.length / pagination.pageSize) || 1)
  if (pagination.current > maxPage)
    pagination.current = maxPage
  const start = (pagination.current - 1) * pagination.pageSize
  tableData.value = filtered.slice(start, start + pagination.pageSize)
}

async function loadTable() {
  loading.value = true
  try {
    const res = await listSessionRobotsApi()
    allRobots.value = res.items || []
    workerInfo.value = res.worker || null
    applyFilterAndPage()
  }
  catch (e) {
    allRobots.value = []
    tableData.value = []
    total.value = 0
    workerInfo.value = null
    Message.error(e instanceof Error ? e.message : '加载失败')
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  applyFilterAndPage()
}

function handleReset() {
  params.keyword = ''
  pagination.current = 1
  applyFilterAndPage()
}

function onPageChange(current: number) {
  pagination.current = current
  applyFilterAndPage()
}

function onPageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  applyFilterAndPage()
}

function resetEditForm() {
  editForm.robotId = ''
  editForm.name = ''
  editForm.type = 'wecom_aibot'
  editForm.botId = ''
  editForm.secret = ''
  editForm.methodKey = ''
  editForm.executeTimeoutSec = undefined
  editForm.inputMapping = defaultInput.value.map(x => ({ ...x }))
  editForm.outputMapping = defaultOutput.value.map(x => ({ ...x }))
}

function openAdd() {
  editMode.value = 'add'
  resetEditForm()
  editVisible.value = true
}

function openEdit(row: SessionRobot) {
  editMode.value = 'edit'
  editForm.robotId = row.robotId
  editForm.name = row.name
  editForm.type = row.type
  editForm.botId = row.botId
  editForm.secret = row.secret || ''
  editForm.methodKey = row.methodKey || ''
  editForm.executeTimeoutSec
    = row.executeTimeoutSec != null && row.executeTimeoutSec > 0
      ? row.executeTimeoutSec
      : undefined
  editForm.inputMapping = (row.inputMapping?.length ? row.inputMapping : defaultInput.value).map(x => ({ ...x }))
  editForm.outputMapping = (row.outputMapping?.length ? row.outputMapping : defaultOutput.value).map(x => ({ ...x }))
  editVisible.value = true
}

function addMappingRow(kind: 'input' | 'output') {
  const row = { source: '', target: '' }
  if (kind === 'input')
    editForm.inputMapping.push(row)
  else
    editForm.outputMapping.push(row)
}

function removeMappingRow(kind: 'input' | 'output', index: number) {
  if (kind === 'input')
    editForm.inputMapping.splice(index, 1)
  else
    editForm.outputMapping.splice(index, 1)
}

async function saveEdit() {
  if (!editForm.name.trim()) {
    Message.warning('请填写名称')
    return false
  }
  if (!editForm.botId.trim()) {
    Message.warning('请填写 BotID')
    return false
  }
  if (editMode.value === 'add' && !editForm.secret.trim()) {
    Message.warning('请填写 Secret')
    return false
  }
  saving.value = true
  try {
    const rawTimeout = editForm.executeTimeoutSec
    let executeTimeoutSec: number | null = null
    if (rawTimeout != null) {
      const n = Number(rawTimeout)
      if (!Number.isFinite(n) || n <= 0) {
        Message.warning('执行超时须为正整数秒，或留空使用全局默认')
        return false
      }
      executeTimeoutSec = Math.floor(n)
    }
    await saveSessionRobotApi({
      robotId: editForm.robotId || undefined,
      name: editForm.name.trim(),
      type: editForm.type,
      botId: editForm.botId.trim(),
      secret: editForm.secret,
      methodKey: editForm.methodKey,
      executeTimeoutSec,
      inputMapping: editForm.inputMapping.filter(m => m.source && m.target),
      outputMapping: editForm.outputMapping.filter(m => m.source && m.target)
    })
    Message.success('已保存')
    editVisible.value = false
    await loadTable()
    return true
  }
  catch (e) {
    Message.error(e instanceof Error ? e.message : '保存失败')
    return false
  }
  finally {
    saving.value = false
  }
}

async function onStart(row: SessionRobot) {
  if (!row.methodKey) {
    Message.warning('请先编辑并绑定流程')
    openEdit(row)
    return
  }
  actionLoadingId.value = row.robotId
  try {
    const data = await startSessionRobotApi(row.robotId)
    if (data.statusMessage && data.status === 'offline')
      Message.warning(data.statusMessage)
    else
      Message.success('已下发启动')
    await loadTable()
    // Worker 拉起需片刻，再刷一次
    window.setTimeout(() => { void loadTable() }, 2500)
  }
  catch (e) {
    Message.error(e instanceof Error ? e.message : '启动失败')
  }
  finally {
    actionLoadingId.value = ''
  }
}

async function onStop(row: SessionRobot) {
  actionLoadingId.value = row.robotId
  try {
    await stopSessionRobotApi(row.robotId)
    Message.success('已下发停用')
    await loadTable()
    window.setTimeout(() => { void loadTable() }, 1500)
  }
  catch (e) {
    Message.error(e instanceof Error ? e.message : '停用失败')
  }
  finally {
    actionLoadingId.value = ''
  }
}

async function onDelete(row: SessionRobot) {
  actionLoadingId.value = row.robotId
  try {
    await deleteSessionRobotApi(row.robotId)
    Message.success('已删除')
    await loadTable()
  }
  catch (e) {
    Message.error(e instanceof Error ? e.message : '删除失败')
  }
  finally {
    actionLoadingId.value = ''
  }
}

watch(
  () => props.visible,
  async (v) => {
    if (!v)
      return
    pagination.current = 1
    params.keyword = ''
    await loadDefaults()
    await loadFlows()
    await loadTable()
  }
)
</script>

<template>
  <Modal
    :visible="visible"
    title="会话机器人"
    :footer="false"
    width="960px"
    unmount-on-close
    align-center
    modal-class="flow-session-robot-panel-modal"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flow-session-robot-panel">
      <Typography.Paragraph type="secondary" class="flow-session-robot-panel__hint">
        收到企微消息后按映射调用已绑定流程，再按输出映射回发。监听由独立 Robot Worker 进程负责；
        <code>python run.py</code> 会自动拉起。
      </Typography.Paragraph>
      <div
        v-if="workerInfo && workerInfo.online === false"
        class="flow-session-robot-panel__worker flow-session-robot-panel__worker--offline"
      >
        Robot Worker 未在线：请用 APP_ENV=dev python run.py 启动（或单独运行 python -m src.flowgame.robot_channel.worker）
      </div>
      <div
        v-else-if="workerInfo?.online"
        class="flow-session-robot-panel__worker"
      >
        Robot Worker 在线
      </div>

      <Form class="flow-session-robot-panel__search" :model="params" layout="inline">
        <FormItem label="关键词" field="keyword">
          <Input
            v-model="params.keyword"
            :style="{ width: '220px' }"
            placeholder="名称 / 流程 / 状态 / BotID"
            allow-clear
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem hide-label>
          <Button type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button class="flow-session-robot-panel__reset-btn" @click="handleReset">
            重置
          </Button>
        </FormItem>
        <FormItem v-if="!readonlyHint" hide-label>
          <Button type="primary" status="success" @click="openAdd">
            新增机器人
          </Button>
        </FormItem>
      </Form>

      <Table
        :data="tableData"
        :loading="loading"
        :pagination="false"
        row-key="robotId"
        :scroll="{ x: 900 }"
      >
        <template #columns>
          <TableColumn title="名称" data-index="name" :width="140" />
          <TableColumn title="类型" :width="160">
            <template #cell="{ record }">
              {{ typeLabel(record.type) }}
            </template>
          </TableColumn>
          <TableColumn title="状态" :width="140">
            <template #cell="{ record }">
              <span>{{ statusLabel(record.status) }}</span>
              <div v-if="record.statusMessage" style="color: var(--color-text-3); font-size: 12px;">
                {{ record.statusMessage }}
              </div>
            </template>
          </TableColumn>
          <TableColumn title="绑定流程" data-index="methodKey" :width="160" ellipsis tooltip />
          <TableColumn title="操作" :width="280" fixed="right">
            <template #cell="{ record }">
              <Space>
                <Link
                  v-if="record.status !== 'running' && record.status !== 'connecting'"
                  :disabled="readonlyHint || actionLoadingId === record.robotId"
                  @click="onStart(record)"
                >
                  启动
                </Link>
                <Link
                  v-else
                  :disabled="readonlyHint || actionLoadingId === record.robotId"
                  @click="onStop(record)"
                >
                  停用
                </Link>
                <Link :disabled="readonlyHint" @click="openEdit(record)">
                  配置
                </Link>
                <Popconfirm content="确认删除该机器人？" @ok="onDelete(record)">
                  <Link status="danger" :disabled="readonlyHint || actionLoadingId === record.robotId">
                    删除
                  </Link>
                </Popconfirm>
              </Space>
            </template>
          </TableColumn>
        </template>
        <template #empty>
          <div style="padding: 24px; color: var(--color-text-3);">
            {{ params.keyword ? '没有匹配的机器人' : '暂无会话机器人，点击「新增机器人」创建' }}
          </div>
        </template>
      </Table>

      <div class="flow-session-robot-panel__pagination">
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

  <Modal
    v-model:visible="editVisible"
    :title="editMode === 'add' ? '新增会话机器人' : '配置会话机器人'"
    :ok-loading="saving"
    width="720px"
    unmount-on-close
    :mask-closable="false"
    @before-ok="saveEdit"
  >
      <Form :model="editForm" layout="vertical">
        <FormItem label="名称" required>
          <Input v-model="editForm.name" placeholder="例如：情报推送机器人" />
        </FormItem>
        <FormItem label="类型" required>
          <Select v-model="editForm.type" :options="typeOptions" />
        </FormItem>
        <FormItem label="BotID" required>
          <Input v-model="editForm.botId" placeholder="企业微信智能机器人 BotID" />
        </FormItem>
        <FormItem :label="editMode === 'edit' ? 'Secret（留空或 *** 表示不修改）' : 'Secret'" required>
          <Input
            v-model="editForm.secret"
            type="password"
            allow-clear
            placeholder="企业微信智能机器人 Secret"
          />
        </FormItem>
        <FormItem label="绑定流程（methodKey）">
          <Select
            v-model="editForm.methodKey"
            allow-search
            allow-clear
            placeholder="选择已保存流程（建议 Api接口开始）"
            :options="flowOptions"
          />
        </FormItem>
        <FormItem :label="`执行超时（秒，可选）`">
          <InputNumber
            v-model="editForm.executeTimeoutSec"
            :min="1"
            :precision="0"
            allow-clear
            hide-button
            style="width: 100%;"
            :placeholder="`留空则用全局默认 ${defaultExecuteTimeoutSec}s（FLOWGAME_ROBOT_EXECUTE_TIMEOUT_SEC）`"
          />
        </FormItem>

        <FormItem label="输入映射（入站字段 → 流程变量）">
          <div class="robot-mapping-list">
            <div
              v-for="(row, idx) in editForm.inputMapping"
              :key="`in-${idx}`"
              class="robot-mapping-row"
            >
              <div class="robot-mapping-field">
                <Input
                  :model-value="row.source"
                  placeholder="源 text/target/…"
                  allow-clear
                  @update:model-value="(v) => { row.source = String(v ?? '') }"
                />
              </div>
              <span class="robot-mapping-arrow">→</span>
              <div class="robot-mapping-field">
                <Input
                  :model-value="row.target"
                  placeholder="目标 message/chatId…"
                  allow-clear
                  @update:model-value="(v) => { row.target = String(v ?? '') }"
                />
              </div>
              <Button class="robot-mapping-del" @click="removeMappingRow('input', idx)">
                删
              </Button>
            </div>
            <Button size="mini" @click="addMappingRow('input')">
              加一行
            </Button>
          </div>
        </FormItem>

        <FormItem label="输出映射（流程输出 → 回发）">
          <div class="robot-mapping-list">
            <div
              v-for="(row, idx) in editForm.outputMapping"
              :key="`out-${idx}`"
              class="robot-mapping-row"
            >
              <div class="robot-mapping-field">
                <Input
                  :model-value="row.source"
                  placeholder="源 assistantMessage…"
                  allow-clear
                  @update:model-value="(v) => { row.source = String(v ?? '') }"
                />
              </div>
              <span class="robot-mapping-arrow">→</span>
              <div class="robot-mapping-field">
                <Select
                  :model-value="row.target"
                  placeholder="回发方式"
                  :options="outputTargetOptions"
                  @update:model-value="(v) => { row.target = String(v ?? '') }"
                />
              </div>
              <Button class="robot-mapping-del" @click="removeMappingRow('output', idx)">
                删
              </Button>
            </div>
            <Button size="mini" @click="addMappingRow('output')">
              加一行
            </Button>
            <div class="robot-mapping-hint">
              结束节点输出字段名填在「源」。文字映射到 reply_markdown / reply_text；文件路径映射到 reply_file（字符串或路径数组）。两者都有时先发文字再发文件。
            </div>
          </div>
        </FormItem>
      </Form>
  </Modal>
</template>

<style scoped>
.flow-session-robot-panel__hint {
  margin-bottom: 8px;
}

.flow-session-robot-panel__worker {
  margin-bottom: 12px;
  color: var(--color-text-3);
  font-size: 12px;
}

.flow-session-robot-panel__worker--offline {
  color: rgb(var(--danger-6));
  font-size: 13px;
}

.flow-session-robot-panel__search {
  margin-bottom: 12px;
}

.flow-session-robot-panel__reset-btn {
  margin-left: 8px;
}

.flow-session-robot-panel__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.robot-mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.robot-mapping-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.robot-mapping-field {
  flex: 1 1 0;
  min-width: 0;
  width: 0; /* 强制 flex 子项均分，避免 Select 撑破盖住左侧 Input */
}

.robot-mapping-field :deep(.arco-input-wrapper),
.robot-mapping-field :deep(.arco-select-view-single) {
  width: 100%;
}

.robot-mapping-arrow {
  flex: 0 0 auto;
  line-height: 32px;
  color: var(--color-text-3);
}

.robot-mapping-del {
  flex: 0 0 auto;
}

.robot-mapping-hint {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}
</style>
