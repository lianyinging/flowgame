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
  Textarea,
  Typography
} from '@arco-design/web-vue'
import {
  deleteDigitalEmployeeApi,
  getDigitalEmployeeDefaultsApi,
  listAgentTeams,
  listDigitalEmployeesApi,
  listFlowListApi,
  saveDigitalEmployeeApi,
  type DigitalEmployee,
  type SessionRobotBindType
} from '@flowgame/core'

const props = defineProps<{
  visible: boolean
  editorReadonly?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const allEmployees = ref<DigitalEmployee[]>([])
const tableData = ref<DigitalEmployee[]>([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 10 })
const params = reactive<{ keyword?: string }>({})
const flowOptions = ref<{ label: string, value: string }[]>([])
const teamOptions = ref<{ label: string, value: string }[]>([])
const bindTypeOptions = ref<{ label: string, value: SessionRobotBindType }[]>([
  { label: '任务目标：流程（methodKey）', value: 'flow' },
  { label: '任务目标：AgentTeam（teamKey）', value: 'team' }
])

const editVisible = ref(false)
const editMode = ref<'add' | 'edit'>('add')
const saving = ref(false)
const actionLoadingId = ref('')

const editForm = reactive({
  employeeId: '',
  name: '',
  description: '',
  decisionMethodKey: '',
  bindType: 'flow' as SessionRobotBindType,
  methodKey: '',
  teamKey: '',
  executeTimeoutSec: undefined as number | undefined
})

const defaultExecuteTimeoutSec = ref(120)
const defaultTeamExecuteTimeoutSec = ref(600)

const timeoutPlaceholder = computed(() => {
  if (editForm.bindType === 'team')
    return `留空则用 Team 默认 ${defaultTeamExecuteTimeoutSec.value}s`
  return `留空则用全局默认 ${defaultExecuteTimeoutSec.value}s`
})

const readonlyHint = computed(() => props.editorReadonly)

const decisionTargetLabel = (row: DigitalEmployee) => {
  const key = (row.decisionMethodKey || '').trim()
  return key || '—'
}

const taskTargetLabel = (row: DigitalEmployee) => {
  const bindType = row.bindType === 'team' ? 'team' : 'flow'
  if (bindType === 'team')
    return row.teamKey ? `Team: ${row.teamKey}` : '（未绑 Team）'
  return row.methodKey ? `流程: ${row.methodKey}` : '（未绑流程）'
}

async function loadDefaults() {
  try {
    const d = await getDigitalEmployeeDefaultsApi()
    if (d.bindTypes?.length)
      bindTypeOptions.value = d.bindTypes
    if (d.defaultExecuteTimeoutSec && d.defaultExecuteTimeoutSec > 0)
      defaultExecuteTimeoutSec.value = d.defaultExecuteTimeoutSec
    if (d.defaultTeamExecuteTimeoutSec && d.defaultTeamExecuteTimeoutSec > 0)
      defaultTeamExecuteTimeoutSec.value = d.defaultTeamExecuteTimeoutSec
  }
  catch {
    // keep defaults
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

function ensureFlowOption(methodKey: string) {
  const key = (methodKey || '').trim()
  if (!key)
    return
  if (flowOptions.value.some(o => o.value === key))
    return
  flowOptions.value = [
    { label: `${key}（已绑定，未在流程列表中）`, value: key },
    ...flowOptions.value
  ]
}

function ensureTeamOption(teamKey: string) {
  const key = (teamKey || '').trim()
  if (!key)
    return
  if (teamOptions.value.some(o => o.value === key))
    return
  teamOptions.value = [
    { label: `${key}（已绑定，未在 Team 列表中）`, value: key },
    ...teamOptions.value
  ]
}

async function loadTeams() {
  try {
    const teams = await listAgentTeams()
    teamOptions.value = (teams || []).map(t => ({
      label: t.name ? `${t.name}（${t.teamKey}）` : t.teamKey,
      value: t.teamKey
    })).filter(o => o.value)
  }
  catch {
    teamOptions.value = []
  }
}

function applyFilterAndPage() {
  const keyword = (params.keyword || '').trim().toLowerCase()
  let filtered = [...allEmployees.value]
  if (keyword) {
    filtered = filtered.filter((r) => {
      const hay = [
        r.name,
        r.employeeId,
        r.description || '',
        r.methodKey || '',
        r.teamKey || '',
        r.decisionMethodKey || '',
        r.bindType || ''
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
    const res = await listDigitalEmployeesApi()
    allEmployees.value = res.items || []
    applyFilterAndPage()
  }
  catch (e) {
    allEmployees.value = []
    tableData.value = []
    total.value = 0
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
  editForm.employeeId = ''
  editForm.name = ''
  editForm.description = ''
  editForm.decisionMethodKey = ''
  editForm.bindType = 'flow'
  editForm.methodKey = ''
  editForm.teamKey = ''
  editForm.executeTimeoutSec = undefined
}

function onBindTypeChange(value: string | number | boolean | Record<string, unknown> | (string | number | boolean | Record<string, unknown>)[]) {
  const next = (Array.isArray(value) ? value[0] : value) as SessionRobotBindType
  editForm.bindType = next === 'team' ? 'team' : 'flow'
}

function openAdd() {
  editMode.value = 'add'
  resetEditForm()
  editVisible.value = true
}

function openEdit(row: DigitalEmployee) {
  editMode.value = 'edit'
  editForm.employeeId = row.employeeId
  editForm.name = row.name
  editForm.description = row.description || ''
  editForm.decisionMethodKey = row.decisionMethodKey || ''
  editForm.bindType = row.bindType === 'team' ? 'team' : 'flow'
  editForm.methodKey = row.methodKey || ''
  editForm.teamKey = row.teamKey || ''
  editForm.executeTimeoutSec
    = row.executeTimeoutSec != null && row.executeTimeoutSec > 0
      ? row.executeTimeoutSec
      : undefined
  ensureFlowOption(editForm.decisionMethodKey)
  ensureFlowOption(editForm.methodKey)
  ensureTeamOption(editForm.teamKey)
  editVisible.value = true
}

async function saveEdit() {
  if (!editForm.name.trim()) {
    Message.warning('请填写名称')
    return false
  }
  if (editForm.bindType === 'team' && !editForm.teamKey.trim()) {
    Message.warning('请选择任务目标 AgentTeam')
    return false
  }
  if (editForm.bindType === 'flow' && !editForm.methodKey.trim()) {
    Message.warning('请选择任务目标流程')
    return false
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
    await saveDigitalEmployeeApi({
      employeeId: editForm.employeeId || undefined,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      bindType: editForm.bindType,
      methodKey: editForm.methodKey,
      teamKey: editForm.teamKey,
      decisionMethodKey: editForm.decisionMethodKey,
      executeTimeoutSec
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

async function onDelete(row: DigitalEmployee) {
  actionLoadingId.value = row.employeeId
  try {
    await deleteDigitalEmployeeApi(row.employeeId)
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
    await Promise.all([loadFlows(), loadTeams()])
    await loadTable()
  }
)
</script>

<template>
  <Modal
    :visible="visible"
    title="数字员工"
    :footer="false"
    width="960px"
    unmount-on-close
    align-center
    modal-class="flow-digital-employee-panel-modal"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flow-digital-employee-panel">
      <Typography.Paragraph type="secondary" class="flow-digital-employee-panel__hint">
        数字员工绑定「决策目标」与「任务目标」。会话机器人可绑定多名员工；
        ≥2 名时按本处「说明」做 LLM 自动路由，请把职责写清楚、互不混淆。
        有决策时先跑决策（<code>shouldRun</code>）；通过后再跑任务（流程或 AgentTeam）。
      </Typography.Paragraph>

      <Form class="flow-digital-employee-panel__search" :model="params" layout="inline">
        <FormItem label="关键词" field="keyword">
          <Input
            v-model="params.keyword"
            :style="{ width: '220px' }"
            placeholder="名称 / 决策 / 任务"
            allow-clear
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem hide-label>
          <Button type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button class="flow-digital-employee-panel__reset-btn" @click="handleReset">
            重置
          </Button>
        </FormItem>
        <FormItem v-if="!readonlyHint" hide-label>
          <Button type="primary" status="success" @click="openAdd">
            新增数字员工
          </Button>
        </FormItem>
      </Form>

      <Table
        :data="tableData"
        :loading="loading"
        :pagination="false"
        row-key="employeeId"
        :scroll="{ x: 800 }"
      >
        <template #columns>
          <TableColumn title="名称" data-index="name" :width="160" />
          <TableColumn title="决策目标" :width="180" ellipsis tooltip>
            <template #cell="{ record }">
              {{ decisionTargetLabel(record) }}
            </template>
          </TableColumn>
          <TableColumn title="任务目标" :width="200" ellipsis tooltip>
            <template #cell="{ record }">
              {{ taskTargetLabel(record) }}
            </template>
          </TableColumn>
          <TableColumn title="说明" data-index="description" :width="180" ellipsis tooltip />
          <TableColumn title="操作" :width="160" fixed="right">
            <template #cell="{ record }">
              <Space>
                <Link :disabled="readonlyHint" @click="openEdit(record)">
                  配置
                </Link>
                <Popconfirm content="确认删除该数字员工？" @ok="onDelete(record)">
                  <Link status="danger" :disabled="readonlyHint || actionLoadingId === record.employeeId">
                    删除
                  </Link>
                </Popconfirm>
              </Space>
            </template>
          </TableColumn>
        </template>
        <template #empty>
          <div style="padding: 24px; color: var(--color-text-3);">
            {{ params.keyword ? '没有匹配的数字员工' : '暂无数字员工，点击「新增数字员工」创建' }}
          </div>
        </template>
      </Table>

      <div class="flow-digital-employee-panel__pagination">
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
    :title="editMode === 'add' ? '新增数字员工' : '配置数字员工'"
    :ok-loading="saving"
    width="640px"
    unmount-on-close
    :mask-closable="false"
    @before-ok="saveEdit"
  >
    <Form :model="editForm" layout="vertical">
      <FormItem label="名称" required>
        <Input v-model="editForm.name" placeholder="例如：情报分析员工" />
      </FormItem>
      <FormItem label="说明">
        <Textarea
          v-model="editForm.description"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          placeholder="职责说明；多员工自动路由时必填，供大模型区分"
        />
      </FormItem>
      <FormItem label="决策目标（可选）">
        <Select
          v-model="editForm.decisionMethodKey"
          allow-search
          allow-clear
          placeholder="先判断是否执行任务；留空则消息直接跑任务目标"
          :options="flowOptions"
        />
        <div class="employee-form-hint">
          已保存流程即可，不必发布为 Agent。建议产出
          <code>shouldRun</code>、<code>output</code>、<code>topic</code>、<code>reason</code>。
        </div>
      </FormItem>
      <FormItem label="任务类型" required>
        <Select
          :model-value="editForm.bindType"
          :options="bindTypeOptions"
          @change="onBindTypeChange"
        />
      </FormItem>
      <FormItem
        v-if="editForm.bindType === 'flow'"
        label="任务目标：流程（methodKey）"
        required
      >
        <Select
          v-model="editForm.methodKey"
          allow-search
          allow-clear
          placeholder="选择已保存流程"
          :options="flowOptions"
        />
      </FormItem>
      <FormItem
        v-else
        label="任务目标：AgentTeam（teamKey）"
        required
      >
        <Select
          v-model="editForm.teamKey"
          allow-search
          allow-clear
          placeholder="选择已配置的 AgentTeam"
          :options="teamOptions"
        />
      </FormItem>
      <FormItem label="执行超时（秒，可选）">
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
    </Form>
  </Modal>
</template>

<style scoped>
.flow-digital-employee-panel__hint {
  margin-bottom: 8px;
}

.flow-digital-employee-panel__search {
  margin-bottom: 12px;
}

.flow-digital-employee-panel__reset-btn {
  margin-left: 8px;
}

.flow-digital-employee-panel__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.employee-form-hint {
  margin-top: 6px;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}
</style>
