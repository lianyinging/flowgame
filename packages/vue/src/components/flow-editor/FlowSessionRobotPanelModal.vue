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
  listDigitalEmployeesApi,
  listSessionRobotsApi,
  saveSessionRobotApi,
  startSessionRobotApi,
  stopSessionRobotApi,
  type DigitalEmployee,
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
const employeeOptions = ref<{ label: string, value: string }[]>([])
const employeesById = ref<Record<string, DigitalEmployee>>({})
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
  employeeIds: [] as string[],
  defaultEmployeeId: '',
  routerProvider: 'deepseek',
  routerApiKey: '',
  routerModel: 'deepseek-v4-flash',
  /** 空 / undefined 表示未配置，走员工或全局默认 */
  executeTimeoutSec: undefined as number | undefined,
  inputMapping: [] as RobotFieldMapping[],
  outputMapping: [] as RobotFieldMapping[]
})

const defaultInput = ref<RobotFieldMapping[]>([])
const defaultOutput = ref<RobotFieldMapping[]>([])
const defaultTeamOutput = ref<RobotFieldMapping[]>([
  { source: 'output', target: 'reply_markdown' }
])
const defaultExecuteTimeoutSec = ref(120)
const defaultTeamExecuteTimeoutSec = ref(600)
const defaultRouterProvider = ref('deepseek')
const defaultRouterModel = ref('deepseek-v4-flash')
const routerProviderOptions = ref<{ label: string, value: string }[]>([
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'OpenAI', value: 'openai' },
  { label: '通义千问', value: 'qwen' },
  { label: '月之暗面 Kimi', value: 'moonshot' },
  { label: '智谱 GLM', value: 'zhipu' }
])
const routerModelsByProvider = ref<Record<string, { label: string, value: string }[]>>({
  deepseek: [
    { label: 'deepseek-v4-flash', value: 'deepseek-v4-flash' },
    { label: 'deepseek-chat', value: 'deepseek-chat' },
    { label: 'deepseek-reasoner', value: 'deepseek-reasoner' }
  ],
  openai: [
    { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
    { label: 'gpt-4o', value: 'gpt-4o' },
    { label: 'gpt-4.1-mini', value: 'gpt-4.1-mini' },
    { label: 'o4-mini', value: 'o4-mini' }
  ],
  qwen: [
    { label: 'qwen-plus', value: 'qwen-plus' },
    { label: 'qwen-turbo', value: 'qwen-turbo' },
    { label: 'qwen-max', value: 'qwen-max' },
    { label: 'qwen-long', value: 'qwen-long' }
  ],
  moonshot: [
    { label: 'moonshot-v1-8k', value: 'moonshot-v1-8k' },
    { label: 'moonshot-v1-32k', value: 'moonshot-v1-32k' },
    { label: 'moonshot-v1-128k', value: 'moonshot-v1-128k' }
  ],
  zhipu: [
    { label: 'glm-4-flash', value: 'glm-4-flash' },
    { label: 'glm-4-air', value: 'glm-4-air' },
    { label: 'glm-4-plus', value: 'glm-4-plus' }
  ]
})
const routerModelOptions = computed(() => {
  const pid = editForm.routerProvider || defaultRouterProvider.value
  return routerModelsByProvider.value[pid]
    || routerModelsByProvider.value.deepseek
    || []
})

const outputTargetOptions = [
  { label: 'reply_markdown（回发）', value: 'reply_markdown' },
  { label: 'reply_text（回发）', value: 'reply_text' },
  { label: 'reply_file（回发文件）', value: 'reply_file' }
]

const selectedEmployees = computed(() =>
  editForm.employeeIds
    .map(id => employeesById.value[id])
    .filter((e): e is DigitalEmployee => !!e)
)

const needsRouting = computed(() => editForm.employeeIds.length >= 2)

const defaultEmployeeOptions = computed(() =>
  editForm.employeeIds.map((id) => {
    const emp = employeesById.value[id]
    return {
      label: emp ? emp.name : id,
      value: id
    }
  })
)

const selectedEmployeeBindType = computed(() => {
  const pick = editForm.defaultEmployeeId || editForm.employeeIds[0]
  const emp = pick ? employeesById.value[pick] : undefined
  return emp?.bindType === 'team' ? 'team' : 'flow'
})

const timeoutPlaceholder = computed(() => {
  if (selectedEmployeeBindType.value === 'team')
    return `留空则用员工/Team 默认 ${defaultTeamExecuteTimeoutSec.value}s`
  return `留空则用员工/全局默认 ${defaultExecuteTimeoutSec.value}s`
})

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

function resolveEmployeeIds(row: SessionRobot): string[] {
  if (row.employeeIds?.length)
    return [...row.employeeIds]
  if (row.employeeId)
    return [row.employeeId]
  return []
}

const employeeLabel = (row: SessionRobot) => {
  if (row.employeeName)
    return row.employeeName
  const ids = resolveEmployeeIds(row)
  if (ids.length)
    return ids.length >= 2 ? `${ids.length} 名数字员工` : ids[0]
  if (row.bindType === 'team' && row.teamKey)
    return `（旧）Team: ${row.teamKey}`
  if (row.methodKey)
    return `（旧）流程: ${row.methodKey}`
  return '（未绑定）'
}

const taskTargetLabel = (row: SessionRobot) => {
  if (row.employeeBindLabel)
    return row.employeeBindLabel
  const bindType = row.bindType === 'team' ? 'team' : 'flow'
  if (bindType === 'team')
    return row.teamKey ? `Team: ${row.teamKey}` : '（未绑 Team）'
  return row.methodKey ? `流程: ${row.methodKey}` : '（未绑流程）'
}

const readonlyHint = computed(() => props.editorReadonly)

function applyDefaultOutputForEmployees(employeeIds: string[]) {
  const pick = editForm.defaultEmployeeId || employeeIds[0]
  const emp = pick ? employeesById.value[pick] : undefined
  const bindType = emp?.bindType === 'team' ? 'team' : 'flow'
  const src = bindType === 'team' ? defaultTeamOutput.value : defaultOutput.value
  editForm.outputMapping = src.map(x => ({ ...x }))
}

async function loadDefaults() {
  try {
    const d = await getSessionRobotDefaultsApi()
    if (d.types?.length)
      typeOptions.value = d.types
    defaultInput.value = d.inputMapping || []
    defaultOutput.value = d.outputMapping || []
    if (d.teamOutputMapping?.length)
      defaultTeamOutput.value = d.teamOutputMapping
    if (d.defaultExecuteTimeoutSec && d.defaultExecuteTimeoutSec > 0)
      defaultExecuteTimeoutSec.value = d.defaultExecuteTimeoutSec
    if (d.defaultTeamExecuteTimeoutSec && d.defaultTeamExecuteTimeoutSec > 0)
      defaultTeamExecuteTimeoutSec.value = d.defaultTeamExecuteTimeoutSec
    if (d.routerProviders?.length)
      routerProviderOptions.value = d.routerProviders
    if (d.routerModelsByProvider && Object.keys(d.routerModelsByProvider).length)
      routerModelsByProvider.value = d.routerModelsByProvider
    if (d.defaultRouterProvider)
      defaultRouterProvider.value = d.defaultRouterProvider
    if (d.defaultRouterModel)
      defaultRouterModel.value = d.defaultRouterModel
  }
  catch {
    defaultInput.value = [
      { source: 'text', target: 'message' },
      { source: 'target', target: 'chatId' },
      { source: 'userid', target: 'userId' },
      { source: 'chattype', target: 'chatType' }
    ]
    defaultOutput.value = [{ source: 'assistantMessage', target: 'reply_markdown' }]
    defaultTeamOutput.value = [{ source: 'output', target: 'reply_markdown' }]
  }
}

function ensureEmployeeOption(employeeId: string, name?: string) {
  const key = (employeeId || '').trim()
  if (!key)
    return
  if (employeeOptions.value.some(o => o.value === key))
    return
  employeeOptions.value = [
    { label: `${name || key}（已绑定，未在列表中）`, value: key },
    ...employeeOptions.value
  ]
}

async function loadEmployees() {
  try {
    const res = await listDigitalEmployeesApi()
    const items = res.items || []
    const map: Record<string, DigitalEmployee> = {}
    employeeOptions.value = items.map((e) => {
      map[e.employeeId] = e
      const task = e.bindType === 'team'
        ? (e.teamKey ? `Team:${e.teamKey}` : '未绑任务')
        : (e.methodKey ? `流程:${e.methodKey}` : '未绑任务')
      const decision = e.decisionMethodKey ? `决策:${e.decisionMethodKey}` : '无决策'
      const desc = (e.description || '').trim()
      return {
        label: desc
          ? `${e.name}（${desc.slice(0, 24)}${desc.length > 24 ? '…' : ''}）`
          : `${e.name}（${decision} / ${task}）`,
        value: e.employeeId
      }
    })
    employeesById.value = map
  }
  catch {
    employeeOptions.value = []
    employeesById.value = {}
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
        ...(r.employeeIds || []),
        r.employeeId || '',
        r.employeeName || '',
        r.methodKey,
        r.teamKey || '',
        r.decisionMethodKey || '',
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

function syncRouterModelForProvider() {
  const opts = routerModelOptions.value
  if (!opts.length)
    return
  if (!opts.some(o => o.value === editForm.routerModel))
    editForm.routerModel = opts[0].value
}

function onRouterProviderChange() {
  syncRouterModelForProvider()
}

function resetEditForm() {
  editForm.robotId = ''
  editForm.name = ''
  editForm.type = 'wecom_aibot'
  editForm.botId = ''
  editForm.secret = ''
  editForm.employeeIds = []
  editForm.defaultEmployeeId = ''
  editForm.routerProvider = defaultRouterProvider.value
  editForm.routerApiKey = ''
  editForm.routerModel = defaultRouterModel.value
  editForm.executeTimeoutSec = undefined
  editForm.inputMapping = defaultInput.value.map(x => ({ ...x }))
  editForm.outputMapping = defaultOutput.value.map(x => ({ ...x }))
}

function onEmployeesChange(value: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const list = (Array.isArray(value) ? value : value != null ? [value] : [])
    .map(v => String(v || '').trim())
    .filter(Boolean)
  editForm.employeeIds = list
  if (!list.includes(editForm.defaultEmployeeId))
    editForm.defaultEmployeeId = list[0] || ''
  if (list.length)
    applyDefaultOutputForEmployees(list)
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
  const ids = resolveEmployeeIds(row)
  editForm.employeeIds = ids
  editForm.defaultEmployeeId = row.defaultEmployeeId && ids.includes(row.defaultEmployeeId)
    ? row.defaultEmployeeId
    : (ids[0] || '')
  editForm.routerProvider = row.routerProvider || defaultRouterProvider.value
  editForm.routerApiKey = row.hasRouterApiKey ? '***' : (row.routerApiKey || '')
  editForm.routerModel = row.routerModel || defaultRouterModel.value
  syncRouterModelForProvider()
  editForm.executeTimeoutSec
    = row.executeTimeoutSec != null && row.executeTimeoutSec > 0
      ? row.executeTimeoutSec
      : undefined
  editForm.inputMapping = (row.inputMapping?.length ? row.inputMapping : defaultInput.value).map(x => ({ ...x }))
  ids.forEach((id, idx) => {
    ensureEmployeeOption(id, row.employeeNames?.[idx] || row.employeeName)
  })
  const pick = editForm.defaultEmployeeId || ids[0]
  const emp = pick ? employeesById.value[pick] : undefined
  const bindType = emp?.bindType === 'team' ? 'team' : 'flow'
  const def = bindType === 'team' ? defaultTeamOutput.value : defaultOutput.value
  editForm.outputMapping = (row.outputMapping?.length ? row.outputMapping : def).map(x => ({ ...x }))
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
  if (!editForm.employeeIds.length) {
    Message.warning('请至少选择一名数字员工')
    return false
  }
  const unbound = editForm.employeeIds.filter((id) => {
    const emp = employeesById.value[id]
    return emp && emp.bound === false
  })
  if (unbound.length) {
    Message.warning('所选数字员工中有未配置任务目标的，请先在「数字员工」中配置')
    return false
  }
  if (needsRouting.value) {
    const missingDesc = selectedEmployees.value.filter(e => !(e.description || '').trim())
    if (missingDesc.length) {
      Message.warning(`自动路由依赖员工描述，请先为「${missingDesc.map(e => e.name).join('、')}」填写说明`)
      return false
    }
  }
  saving.value = true
  try {
    const rawTimeout = editForm.executeTimeoutSec
    let executeTimeoutSec: number | null = null
    if (rawTimeout != null) {
      const n = Number(rawTimeout)
      if (!Number.isFinite(n) || n <= 0) {
        Message.warning('执行超时须为正整数秒，或留空使用默认')
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
      employeeIds: editForm.employeeIds,
      defaultEmployeeId: editForm.defaultEmployeeId || editForm.employeeIds[0],
      routerProvider: editForm.routerProvider || defaultRouterProvider.value,
      routerApiKey: editForm.routerApiKey,
      routerModel: editForm.routerModel.trim() || defaultRouterModel.value,
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
  const ids = resolveEmployeeIds(row)
  if (!ids.length && !row.methodKey && !row.teamKey) {
    Message.warning('请先编辑并绑定数字员工')
    openEdit(row)
    return
  }
  if (ids.length && row.employeeBound === false) {
    Message.warning('绑定的数字员工尚未配置任务目标')
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
    await loadEmployees()
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
        会话机器人是通道入口（企微 Bot 等），可绑定一名或多名「数字员工」。
        绑多名时，每条消息会按员工「说明」用 LLM 自动路由（默认 deepseekFlash）；绑一名则直接执行。
        决策目标与任务目标在数字员工上配置。监听由 Robot Worker 负责；
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
            placeholder="名称 / 数字员工 / 状态 / BotID"
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
          <TableColumn title="数字员工" :width="160" ellipsis tooltip>
            <template #cell="{ record }">
              {{ employeeLabel(record) }}
            </template>
          </TableColumn>
          <TableColumn title="任务目标" :width="180" ellipsis tooltip>
            <template #cell="{ record }">
              {{ taskTargetLabel(record) }}
            </template>
          </TableColumn>
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
        <FormItem label="绑定数字员工" required>
          <Select
            :model-value="editForm.employeeIds"
            multiple
            allow-search
            allow-clear
            placeholder="可多选；≥2 名时按员工说明自动路由"
            :options="employeeOptions"
            @change="onEmployeesChange"
          />
          <div v-if="selectedEmployees.length" class="robot-mapping-hint" style="margin-top: 6px;">
            <div v-for="emp in selectedEmployees" :key="emp.employeeId">
              <code>{{ emp.name }}</code>：
              {{ emp.description || '（无描述，多绑时请补充）' }}
              · 任务
              <code>
                {{
                  emp.bindType === 'team'
                    ? (emp.teamKey ? `Team ${emp.teamKey}` : '未绑')
                    : (emp.methodKey ? `流程 ${emp.methodKey}` : '未绑')
                }}
              </code>
            </div>
          </div>
          <div v-else class="robot-mapping-hint" style="margin-top: 6px;">
            请先在工具栏「数字员工」中创建并配置决策/任务目标与职责说明。
          </div>
        </FormItem>
        <FormItem v-if="needsRouting" label="默认数字员工（路由失败时）" required>
          <Select
            v-model="editForm.defaultEmployeeId"
            allow-search
            placeholder="路由失败时使用"
            :options="defaultEmployeeOptions"
          />
        </FormItem>
        <template v-if="needsRouting">
          <FormItem label="路由模型厂家" required>
            <Select
              v-model="editForm.routerProvider"
              allow-search
              placeholder="选择厂家"
              :options="routerProviderOptions"
              @change="onRouterProviderChange"
            />
          </FormItem>
          <FormItem label="路由模型名称" required>
            <Select
              v-model="editForm.routerModel"
              allow-search
              allow-create
              placeholder="选择或输入模型名"
              :options="routerModelOptions"
            />
          </FormItem>
          <FormItem label="路由 API Key（可选）">
            <Input
              v-model="editForm.routerApiKey"
              allow-clear
              placeholder="留空则用服务端 DEEPSEEK_API_KEY；*** 表示不修改"
            />
          </FormItem>
        </template>
        <FormItem :label="`执行超时（秒，可选）`">
          <InputNumber
            v-model="editForm.executeTimeoutSec"
            :min="1"
            :precision="0"
            allow-clear
            hide-button
            style="width: 100%;"
            :placeholder="timeoutPlaceholder"
          />
        </FormItem>

        <FormItem :label="selectedEmployeeBindType === 'team' ? '输入映射（入站字段 → Team 黑板）' : '输入映射（入站字段 → 流程变量）'">
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
                  placeholder="目标 message/chatId/topic…"
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
            <div v-if="selectedEmployeeBindType === 'team'" class="robot-mapping-hint">
              系统会自动注入 robotId / employeeId / robotSpace / chatId / botId / wecomBotSecret / bindType / teamKey；
              topic 为空时用 message（或原文）兜底。回发映射前会脱敏 secret。
            </div>
          </div>
        </FormItem>

        <FormItem :label="selectedEmployeeBindType === 'team' ? '输出映射（Team 输出 → 回发）' : '输出映射（流程输出 → 回发）'">
          <div class="robot-mapping-list">
            <div
              v-for="(row, idx) in editForm.outputMapping"
              :key="`out-${idx}`"
              class="robot-mapping-row"
            >
              <div class="robot-mapping-field">
                <Input
                  :model-value="row.source"
                  :placeholder="selectedEmployeeBindType === 'team' ? '源 output / article…' : '源 assistantMessage…'"
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
              <template v-if="selectedEmployeeBindType === 'team'">
                Team 默认映射 output → reply_markdown；也可映射 blackboard 字段名（如 article）。
                未命中时会回退 Team.output。
                若数字员工配置了决策流程，决策跳过时同样走本映射。
              </template>
              <template v-else>
                结束节点输出字段名填在「源」。文字映射到 reply_markdown / reply_text；文件路径映射到 reply_file。
                决策跳过与任务结束共用本映射。
              </template>
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
