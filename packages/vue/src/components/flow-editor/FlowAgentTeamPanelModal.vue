<script setup lang="ts">
import dayjs from 'dayjs'
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
  AGENT_TEAM_STRATEGY_OPTIONS,
  CONTENT_SUPERVISOR_BLUEPRINTS,
  CONTENT_SUPERVISOR_TEAM_KEY,
  DEFAULT_BLACKBOARD_DEFAULT_KEYS,
  DEFAULT_STATUS_CARD_KEYS,
  createEmptyAgentTeam,
  deleteAgentTeam,
  formatBlackboardDefaults,
  listAgentTeams,
  listFlowAgentConfigs,
  parseBlackboardDefaults,
  parseStatusCardKeys,
  runTeamApi,
  saveAgentTeam,
  seedContentSupervisorTeam,
  type AgentTeamDef,
  type AgentTeamStrategy,
  type FlowAgentConfig,
  type TeamRunResult
} from '@flowgame/core'

const props = defineProps<{
  visible: boolean
  editorReadonly?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const tableData = ref<AgentTeamDef[]>([])
const allTeams = ref<AgentTeamDef[]>([])
const publishedAgents = ref<FlowAgentConfig[]>([])
const total = ref(0)
const pagination = reactive({ current: 1, pageSize: 10 })
const params = reactive<{ keyword?: string }>({})

const editVisible = ref(false)
const blueprintVisible = ref(false)
const runVisible = ref(false)
const runLoading = ref(false)
const runTarget = ref<AgentTeamDef | null>(null)
const runResult = ref<TeamRunResult | null>(null)
const runForm = reactive<Record<string, string>>({})
const runFields = ref<string[]>([...DEFAULT_BLACKBOARD_DEFAULT_KEYS])
const editMode = ref<'add' | 'edit'>('add')
const editForm = reactive({
  teamKey: '',
  name: '',
  description: '',
  strategy: 'supervisor' as AgentTeamStrategy,
  supervisorAgentKey: '',
  membersText: '',
  outputPrimaryKey: '',
  statusCardKeysText: DEFAULT_STATUS_CARD_KEYS.join(', '),
  blackboardDefaultsText: formatBlackboardDefaults({
    topic: '',
    requirement: '',
    target_words: '800'
  }),
  maxSteps: 12,
  maxSameAgentStreak: 2
})

const supervisorOptions = computed(() =>
  publishedAgents.value.map(a => ({
    label: `${a.name} (${a.agentKey})`,
    value: a.agentKey
  }))
)

const memberSelectOptions = computed(() =>
  publishedAgents.value
    .filter(a => a.agentKey !== editForm.supervisorAgentKey)
    .map(a => ({ label: `${a.name} (${a.agentKey})`, value: a.agentKey }))
)

const strategyLabel = (value: AgentTeamStrategy) =>
  AGENT_TEAM_STRATEGY_OPTIONS.find(o => o.value === value)?.label || value

const workerBlueprints = computed(() =>
  CONTENT_SUPERVISOR_BLUEPRINTS.filter(b => !b.isSupervisor)
)
const supervisorBlueprint = computed(() =>
  CONTENT_SUPERVISOR_BLUEPRINTS.find(b => b.isSupervisor)
)

async function refreshAgents() {
  try {
    publishedAgents.value = await listFlowAgentConfigs({ publishedOnly: true })
  }
  catch {
    publishedAgents.value = []
  }
}

async function loadTable() {
  loading.value = true
  try {
    const all = await listAgentTeams({ keyword: params.keyword })
    allTeams.value = all
    total.value = all.length
    const start = (pagination.current - 1) * pagination.pageSize
    tableData.value = all.slice(start, start + pagination.pageSize)
    await refreshAgents()
  }
  catch {
    tableData.value = []
    total.value = 0
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  void loadTable()
}

function handleReset() {
  params.keyword = ''
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

function openCreate() {
  editMode.value = 'add'
  const draft = createEmptyAgentTeam({ name: '' })
  editForm.teamKey = draft.teamKey
  editForm.name = ''
  editForm.description = ''
  editForm.strategy = 'supervisor'
  editForm.supervisorAgentKey = ''
  editForm.membersText = ''
  editForm.outputPrimaryKey = 'article'
  editForm.statusCardKeysText = DEFAULT_STATUS_CARD_KEYS.join(', ')
  editForm.blackboardDefaultsText = formatBlackboardDefaults({
    topic: '',
    requirement: '',
    target_words: '800'
  })
  editForm.maxSteps = 12
  editForm.maxSameAgentStreak = 2
  void refreshAgents()
  editVisible.value = true
}

function openEdit(record: AgentTeamDef) {
  editMode.value = 'edit'
  editForm.teamKey = record.teamKey
  editForm.name = record.name
  editForm.description = record.description
  editForm.strategy = record.strategy
  editForm.supervisorAgentKey = record.supervisorAgentKey || ''
  editForm.membersText = (record.members || [])
    .map(m => `${m.alias || m.agentKey}:${m.agentKey}`)
    .join('\n')
  editForm.outputPrimaryKey = record.outputPrimaryKey || ''
  editForm.statusCardKeysText = (record.statusCardKeys?.length
    ? record.statusCardKeys
    : [...DEFAULT_STATUS_CARD_KEYS]).join(', ')
  const defaults = record.blackboardDefaults && Object.keys(record.blackboardDefaults).length
    ? record.blackboardDefaults
    : { topic: '', requirement: '', target_words: '800' }
  editForm.blackboardDefaultsText = formatBlackboardDefaults(defaults)
  editForm.maxSteps = record.harness?.maxSteps ?? 12
  editForm.maxSameAgentStreak = record.harness?.maxSameAgentStreak ?? 2
  void refreshAgents()
  editVisible.value = true
}

function parseMembers(text: string) {
  const lines = text.split(/\n|,/).map(s => s.trim()).filter(Boolean)
  const members: Array<{ alias: string, agentKey: string }> = []
  for (const line of lines) {
    const [left, right] = line.includes(':') ? line.split(/:(.+)/) : [line, line]
    const alias = (left || '').trim()
    const agentKey = (right || left || '').trim()
    if (!alias || !agentKey)
      continue
    members.push({ alias, agentKey })
  }
  return members
}

async function handleSaveTeam(): Promise<boolean> {
  if (!editForm.name.trim()) {
    Message.warning('请填写团队名称')
    return false
  }
  if (!editForm.teamKey.trim()) {
    Message.warning('teamKey 不能为空')
    return false
  }
  if (editForm.strategy === 'supervisor' && !editForm.supervisorAgentKey.trim()) {
    Message.warning('主控策略须指定「主决策 Agent」')
    return false
  }
  const members = parseMembers(editForm.membersText)
  if (!members.length) {
    Message.warning('请至少配置一个子 Agent 成员')
    return false
  }
  const allowedAgents = members.map(m => m.alias)
  const existing = editMode.value === 'edit'
    ? allTeams.value.find(t => t.teamKey === editForm.teamKey) || null
    : null
  try {
    await saveAgentTeam({
      teamKey: editForm.teamKey.trim(),
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      strategy: editForm.strategy,
      members,
      supervisorAgentKey: editForm.strategy === 'supervisor'
        ? editForm.supervisorAgentKey.trim()
        : undefined,
      blackboardDefaults: (() => {
        const parsed = parseBlackboardDefaults(editForm.blackboardDefaultsText)
        return Object.keys(parsed).length
          ? parsed
          : (existing?.blackboardDefaults || {
              topic: '',
              requirement: '',
              target_words: '800'
            })
      })(),
      statusCardKeys: parseStatusCardKeys(editForm.statusCardKeysText),
      harness: {
        ...(existing?.harness || {
          maxSteps: 12,
          maxSameAgentStreak: 2,
          maxDecisionRetries: 2,
          maxTokenBudget: 200000,
          allowedAgents: []
        }),
        maxSteps: Number(editForm.maxSteps) || 12,
        maxSameAgentStreak: Number(editForm.maxSameAgentStreak) || 2,
        allowedAgents
      },
      outputPrimaryKey: editForm.outputPrimaryKey.trim(),
      updatedAt: new Date().toISOString()
    })
    Message.success(editMode.value === 'add' ? '已创建 AgentTeam' : '已更新 AgentTeam')
    editVisible.value = false
    await loadTable()
    return true
  }
  catch {
    return false
  }
}

async function handleRemove(teamKey: string) {
  try {
    await deleteAgentTeam(teamKey)
    Message.success('已删除')
    await loadTable()
  }
  catch {
    // 拦截器已提示
  }
}

function fillMemberFromAgent(agentKey: string) {
  if (!agentKey)
    return
  if (agentKey === editForm.supervisorAgentKey) {
    Message.warning('主控 Agent 不要写入成员列表，请单独指定「主决策 Agent」')
    return
  }
  const line = `${agentKey}:${agentKey}`
  const cur = editForm.membersText.trim()
  if (cur.split('\n').some(l => l.includes(`:${agentKey}`) || l === agentKey))
    return
  editForm.membersText = cur ? `${cur}\n${line}` : line
}

async function handleImportSupervisorTemplate() {
  loading.value = true
  try {
    const listed = await listAgentTeams()
    const existing = listed.some(t => t.teamKey === CONTENT_SUPERVISOR_TEAM_KEY)
    const result = await seedContentSupervisorTeam({ overwrite: existing })
    const tip = result.teamCreated
      ? `已导入「${result.team.name}」：主控 ${result.team.supervisorAgentKey} + ${result.team.members.length} 子 Agent`
      : `已覆盖更新「${result.team.name}」（${result.agentUpserted} 个 Agent）`
    Message.success(tip)
    await loadTable()
    blueprintVisible.value = true
  }
  catch {
    // 拦截器已提示
  }
  finally {
    loading.value = false
  }
}

function openRun(record: AgentTeamDef) {
  runTarget.value = record
  runResult.value = null
  const defaults = record.blackboardDefaults || {}
  const keys = Object.keys(defaults).length
    ? Object.keys(defaults)
    : [...DEFAULT_BLACKBOARD_DEFAULT_KEYS]
  // 保证常用键在前
  const ordered = [
    ...DEFAULT_BLACKBOARD_DEFAULT_KEYS.filter(k => keys.includes(k)),
    ...keys.filter(k => !(DEFAULT_BLACKBOARD_DEFAULT_KEYS as readonly string[]).includes(k))
  ]
  runFields.value = ordered.length ? ordered : [...DEFAULT_BLACKBOARD_DEFAULT_KEYS]
  for (const key of Object.keys(runForm))
    delete runForm[key]
  for (const key of runFields.value)
    runForm[key] = String(defaults[key] ?? '')
  runVisible.value = true
}

async function handleRunTeam(): Promise<boolean> {
  const team = runTarget.value
  if (!team)
    return false
  if (runFields.value.includes('topic') && !(runForm.topic || '').trim()) {
    Message.warning('请填写 topic')
    return false
  }
  runLoading.value = true
  runResult.value = null
  try {
    const variables: Record<string, string> = {}
    for (const key of runFields.value)
      variables[key] = String(runForm[key] ?? '').trim()
    const result = await runTeamApi({
      teamKey: team.teamKey,
      variables
    })
    runResult.value = result
    if (result.status === 'success')
      Message.success(`Team 完成：${result.exit_reason}`)
    else
      Message.warning(`Team 结束：${result.exit_reason}`)
  }
  catch {
    // 错误已由请求拦截器提示
  }
  finally {
    runLoading.value = false
  }
  return false
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
    title="AgentTeam 列表"
    :width="980"
    :footer="false"
    unmount-on-close
    align-center
    modal-class="flow-agent-team-panel-modal"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flow-agent-team-panel">
      <Typography.Paragraph type="secondary" class="flow-agent-team-panel__hint">
        主控协同：策略选「主控调度 (supervisor)」，指定主决策 Agent；成员为可调度子 Agent 白名单。
        Team / Agent 配置保存在 Redis（/teams、/agents），可一键导入内容工厂模板。
      </Typography.Paragraph>

      <Form class="flow-agent-team-panel__search" :model="params" layout="inline">
        <FormItem label="关键词" field="keyword">
          <Input
            v-model="params.keyword"
            :style="{ width: '200px' }"
            placeholder="团队名称 / teamKey"
            allow-clear
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem hide-label>
          <Button type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button class="flow-agent-team-panel__reset-btn" @click="handleReset">
            重置
          </Button>
        </FormItem>
        <FormItem v-if="!editorReadonly" hide-label>
          <Space>
            <Button type="primary" status="success" @click="openCreate">
              新增 Team
            </Button>
            <Button type="outline" @click="handleImportSupervisorTemplate">
              导入主控模板
            </Button>
            <Button type="text" @click="blueprintVisible = true">
              搭流蓝图
            </Button>
          </Space>
        </FormItem>
      </Form>

      <Table
        :data="tableData"
        :loading="loading"
        row-key="teamKey"
        :pagination="false"
        :scroll="{ x: 920 }"
      >
        <template #columns>
          <TableColumn title="团队名称" data-index="name" :width="160" />
          <TableColumn title="teamKey" data-index="teamKey" :width="150" ellipsis tooltip />
          <TableColumn title="策略" data-index="strategy" :width="150">
            <template #cell="{ record }">
              {{ strategyLabel(record.strategy) }}
            </template>
          </TableColumn>
          <TableColumn title="主决策 Agent" :width="140" ellipsis tooltip>
            <template #cell="{ record }">
              {{ record.strategy === 'supervisor' ? (record.supervisorAgentKey || '—') : '—' }}
            </template>
          </TableColumn>
          <TableColumn title="成员数" :width="80">
            <template #cell="{ record }">
              {{ record.members?.length || 0 }}
            </template>
          </TableColumn>
          <TableColumn title="更新时间" data-index="updatedAt" :width="160">
            <template #cell="{ record }">
              {{ record.updatedAt ? dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '--' }}
            </template>
          </TableColumn>
          <TableColumn title="操作" :width="editorReadonly ? 80 : 200" fixed="right">
            <template #cell="{ record }">
              <Space>
                <Link @click="openRun(record)">
                  试运行
                </Link>
                <Link @click="openEdit(record)">
                  {{ editorReadonly ? '查看' : '编辑' }}
                </Link>
                <Popconfirm
                  v-if="!editorReadonly"
                  content="确认删除该 AgentTeam 吗？"
                  @ok="handleRemove(record.teamKey)"
                >
                  <Link status="danger">
                    删除
                  </Link>
                </Popconfirm>
              </Space>
            </template>
          </TableColumn>
        </template>
      </Table>

      <div class="flow-agent-team-panel__pagination">
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
    :title="editMode === 'add' ? '新增 AgentTeam' : '编辑 AgentTeam'"
    :width="640"
    unmount-on-close
    :on-before-ok="handleSaveTeam"
  >
    <Form :model="editForm" layout="vertical">
      <FormItem label="团队名称" required>
        <Input v-model="editForm.name" placeholder="内容工厂（主控调度）" :disabled="editorReadonly" />
      </FormItem>
      <FormItem label="teamKey" required>
        <Input v-model="editForm.teamKey" :disabled="editMode === 'edit' || editorReadonly" />
      </FormItem>
      <FormItem label="协作策略" help="主控协同请选「主控调度 (supervisor)」">
        <Select
          v-model="editForm.strategy"
          :options="AGENT_TEAM_STRATEGY_OPTIONS"
          :disabled="editorReadonly"
        />
      </FormItem>
      <FormItem
        v-if="editForm.strategy === 'supervisor'"
        label="主决策 Agent"
        required
        help="主控不写长文，只输出 CALL_AGENT / FINISH 决策 JSON"
      >
        <Select
          v-model="editForm.supervisorAgentKey"
          :options="supervisorOptions"
          allow-search
          allow-clear
          placeholder="选择已发布的主控 Agent"
          :disabled="editorReadonly"
        />
      </FormItem>
      <FormItem label="说明">
        <Textarea
          v-model="editForm.description"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          :disabled="editorReadonly"
        />
      </FormItem>
      <FormItem
        label="子 Agent 成员（白名单）"
        help="每行 alias:agentKey；主控不要写在这里。Harness 只允许调度名单内 Agent"
      >
        <Select
          v-if="!editorReadonly"
          placeholder="选择已发布 Agent 追加成员"
          allow-clear
          :options="memberSelectOptions"
          style="margin-bottom: 8px"
          @change="(v: string) => fillMemberFromAgent(v)"
        />
        <Textarea
          v-model="editForm.membersText"
          :auto-size="{ minRows: 4, maxRows: 10 }"
          placeholder="researcher:researcher&#10;writer:writer&#10;reviewer:reviewer"
          :disabled="editorReadonly"
        />
      </FormItem>
      <FormItem v-if="editForm.strategy === 'supervisor'" label="Harness · maxSteps">
        <InputNumber v-model="editForm.maxSteps" :min="1" :max="50" :disabled="editorReadonly" style="width: 100%" />
      </FormItem>
      <FormItem
        v-if="editForm.strategy === 'supervisor'"
        label="Harness · 同 Agent 连调上限"
        help="防止主控反复调用同一子 Agent"
      >
        <InputNumber v-model="editForm.maxSameAgentStreak" :min="1" :max="10" :disabled="editorReadonly" style="width: 100%" />
      </FormItem>
      <FormItem label="主输出字段" help="对应 Team.output.primaryKey，主控内容工厂一般为 article">
        <Input v-model="editForm.outputPrimaryKey" placeholder="article" :disabled="editorReadonly" />
      </FormItem>
      <FormItem
        label="黑板默认值（blackboardDefaults）"
        help="每行 key=value。试运行与 API 未传 variables 时用作初始黑板；可按业务增删键（如 topic、requirement、target_words）"
      >
        <Textarea
          v-model="editForm.blackboardDefaultsText"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          placeholder="topic=&#10;requirement=&#10;target_words=800"
          :disabled="editorReadonly"
        />
      </FormItem>
      <FormItem
        v-if="editForm.strategy === 'supervisor'"
        label="主控看板字段（statusCardKeys）"
        help="逗号分隔。生成 status_card（JSON：每键 empty/type/chars/preview）时只投影这些黑板键；空则用系统默认。黑板仍保留全部内容。"
      >
        <Textarea
          v-model="editForm.statusCardKeysText"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          :placeholder="DEFAULT_STATUS_CARD_KEYS.join(', ')"
          :disabled="editorReadonly"
        />
      </FormItem>
    </Form>
  </Modal>

  <Modal
    v-model:visible="blueprintVisible"
    title="主控协同 · 搭流蓝图"
    :width="720"
    :footer="false"
    unmount-on-close
  >
    <Typography.Paragraph>
      无画布流程时，Runtime 会按内置角色 Prompt 执行（与 demo_orchestrator 一致）。
      若已保存对应 methodKey 流程，则优先跑流程。
    </Typography.Paragraph>

    <div v-if="supervisorBlueprint" class="blueprint-card blueprint-card--master">
      <div class="blueprint-card__title">
        主控 · {{ supervisorBlueprint.title }}
        <Typography.Text code>
          {{ supervisorBlueprint.agentKey }}
        </Typography.Text>
      </div>
      <div class="blueprint-card__meta">
        methodKey=<Typography.Text code>{{ supervisorBlueprint.methodKey }}</Typography.Text>
        · 写 {{ supervisorBlueprint.outputKey }}
      </div>
      <div>{{ supervisorBlueprint.summary }}</div>
      <div class="blueprint-card__nodes">
        节点：{{ supervisorBlueprint.nodes.join(' → ') }}
      </div>
      <ul>
        <li v-for="(tip, i) in supervisorBlueprint.tips" :key="i">
          {{ tip }}
        </li>
      </ul>
    </div>

    <div
      v-for="bp in workerBlueprints"
      :key="bp.agentKey"
      class="blueprint-card"
    >
      <div class="blueprint-card__title">
        {{ bp.title }}
        <Typography.Text code>
          {{ bp.agentKey }}
        </Typography.Text>
      </div>
      <div class="blueprint-card__meta">
        methodKey=<Typography.Text code>{{ bp.methodKey }}</Typography.Text>
        · 读 {{ bp.inputKeys.join(', ') }} → 写 {{ bp.outputKey }}
      </div>
      <div>{{ bp.summary }}</div>
      <div class="blueprint-card__nodes">
        节点：{{ bp.nodes.join(' → ') }}
      </div>
      <ul>
        <li v-for="(tip, i) in bp.tips" :key="i">
          {{ tip }}
        </li>
      </ul>
    </div>
  </Modal>

  <Modal
    v-model:visible="runVisible"
    title="试运行 AgentTeam"
    :width="720"
    :ok-loading="runLoading"
    ok-text="开始执行"
    unmount-on-close
    @before-ok="handleRunTeam"
  >
    <Form :model="runForm" layout="vertical">
      <FormItem
        v-for="key in runFields"
        :key="key"
        :label="key"
        :required="key === 'topic'"
      >
        <Input v-model="runForm[key]" :placeholder="key" />
      </FormItem>
    </Form>

    <div v-if="runResult" class="team-run-result">
      <Typography.Title :heading="6">
        结果 · {{ runResult.status }} / {{ runResult.exit_reason }}
      </Typography.Title>
      <Typography.Paragraph>
        <Typography.Text type="secondary">
          调度轨迹
        </Typography.Text>
      </Typography.Paragraph>
      <pre class="team-run-result__pre">{{ JSON.stringify(runResult.trace, null, 2) }}</pre>
      <Typography.Paragraph>
        <Typography.Text type="secondary">
          主输出
        </Typography.Text>
      </Typography.Paragraph>
      <pre class="team-run-result__pre">{{ typeof runResult.output === 'string' ? runResult.output : JSON.stringify(runResult.output, null, 2) }}</pre>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.flow-agent-team-panel {
  &__hint {
    margin-bottom: 8px !important;
  }

  &__search {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border-2);
  }

  &__reset-btn {
    margin-left: 8px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
}

.blueprint-card {
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  background: var(--color-fill-1);

  &--master {
    border-color: rgb(var(--primary-6));
    background: var(--color-primary-light-1);
  }

  &__title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  &__meta {
    font-size: 12px;
    color: var(--color-text-3);
    margin-bottom: 6px;
  }

  &__nodes {
    font-size: 12px;
    margin: 6px 0;
    color: var(--color-text-2);
  }

  ul {
    margin: 6px 0 0;
    padding-left: 18px;
    font-size: 12px;
    color: var(--color-text-2);
  }
}

:global(.flow-agent-team-panel-modal .arco-modal-body) {
  max-height: min(70vh, 640px);
  overflow: auto;
}

.team-run-result {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-2);

  &__pre {
    max-height: 220px;
    overflow: auto;
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--color-fill-2);
    border-radius: 4px;
  }
}
</style>
