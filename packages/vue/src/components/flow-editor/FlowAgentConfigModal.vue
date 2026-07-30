<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Message,
  Modal,
  Switch,
  Textarea
} from '@arco-design/web-vue'
import {
  getFlowAgentConfig,
  parseFlowNameFromRedisKey,
  saveFlowAgentConfig,
  type FlowAgentConfig,
  type FlowListIndexItem,
  createEmptyAgentConfig
} from '@flowgame/core'

const props = defineProps<{
  visible: boolean
  record: FlowListIndexItem | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: [config: FlowAgentConfig]
}>()

const loading = ref(false)
const form = reactive({
  agentKey: '',
  methodKey: '',
  redisKey: '',
  name: '',
  description: '',
  version: '1.0.0',
  published: false,
  timeoutMs: 120000,
  tagsText: '',
  inputSchemaText: '[]',
  outputSchemaText: '[]'
})

const title = computed(() => {
  const name = props.record?.name || form.methodKey
  return name ? `Agent 配置 · ${name}` : 'Agent 配置'
})

async function loadForm() {
  const record = props.record
  if (!record)
    return
  loading.value = true
  try {
    const methodKey = record.name?.trim() || parseFlowNameFromRedisKey(record.redisKey)
    const existing = await getFlowAgentConfig(record.redisKey)
      || await getFlowAgentConfig(methodKey)
    const base = existing || createEmptyAgentConfig({
      methodKey,
      redisKey: record.redisKey,
      name: record.name
    })
    form.agentKey = base.agentKey
    form.methodKey = base.methodKey
    form.redisKey = base.redisKey
    form.name = base.name
    form.description = base.description
    form.version = base.version
    form.published = base.published
    form.timeoutMs = base.timeoutMs
    form.tagsText = (base.tags || []).join(', ')
    form.inputSchemaText = JSON.stringify(base.inputSchema || [], null, 2)
    form.outputSchemaText = JSON.stringify(base.outputSchema || [], null, 2)
  }
  catch {
    // 拦截器已提示
  }
  finally {
    loading.value = false
  }
}

function parseSchema(text: string, label: string) {
  try {
    const raw = text.trim() || '[]'
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed))
      throw new Error(`${label} 须为 JSON 数组`)
    return parsed.map((item) => {
      if (!item || typeof item !== 'object')
        throw new Error(`${label} 项须为对象`)
      const row = item as Record<string, unknown>
      return {
        name: String(row.name ?? '').trim(),
        dataType: String(row.dataType ?? 'String').trim() || 'String',
        required: Boolean(row.required),
        description: String(row.description ?? '')
      }
    }).filter(f => f.name)
  }
  catch (err) {
    throw new Error(err instanceof Error ? err.message : `${label} JSON 无效`)
  }
}

async function handleOk(): Promise<boolean> {
  if (!form.methodKey.trim()) {
    Message.warning('methodKey 不能为空')
    return false
  }
  let inputSchema
  let outputSchema
  try {
    inputSchema = parseSchema(form.inputSchemaText, 'inputSchema')
    outputSchema = parseSchema(form.outputSchemaText, 'outputSchema')
  }
  catch (err) {
    Message.error(err instanceof Error ? err.message : '契约解析失败')
    return false
  }
  const tags = form.tagsText
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean)
  try {
    const saved = await saveFlowAgentConfig({
      agentKey: form.agentKey.trim() || form.methodKey.trim(),
      methodKey: form.methodKey.trim(),
      redisKey: form.redisKey,
      name: form.name.trim() || form.methodKey.trim(),
      description: form.description.trim(),
      version: form.version.trim() || '1.0.0',
      published: form.published,
      timeoutMs: Number(form.timeoutMs) || 120000,
      tags,
      inputSchema,
      outputSchema,
      updatedAt: new Date().toISOString()
    })
    Message.success(saved.published ? '已保存并标记为可加入 AgentTeam' : '已保存（未发布为 Agent）')
    emit('saved', saved)
    emit('update:visible', false)
    return true
  }
  catch {
    return false
  }
}

watch(() => props.visible, (open) => {
  if (open)
    void loadForm()
})
</script>

<template>
  <Modal
    :visible="visible"
    :title="title"
    :width="640"
    unmount-on-close
    ok-text="保存配置"
    :ok-loading="loading"
    :on-before-ok="handleOk"
    @update:visible="emit('update:visible', $event)"
  >
    <Form :model="form" layout="vertical" class="flow-agent-config-form">
      <FormItem label="发布为 Agent" help="开启后可出现在 AgentTeam 成员下拉中（存 Redis /agents）">
        <Switch v-model="form.published" />
      </FormItem>
      <FormItem label="Agent Key" required>
        <Input v-model="form.agentKey" placeholder="如 writer_v1" allow-clear />
      </FormItem>
      <FormItem label="显示名称" required>
        <Input v-model="form.name" placeholder="专栏写手" allow-clear />
      </FormItem>
      <FormItem label="methodKey（绑定流程）">
        <Input v-model="form.methodKey" disabled />
      </FormItem>
      <FormItem label="说明">
        <Textarea
          v-model="form.description"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          placeholder="单职责描述，便于 Team 主控选择"
        />
      </FormItem>
      <FormItem label="版本">
        <Input v-model="form.version" placeholder="1.0.0" />
      </FormItem>
      <FormItem label="超时 (ms)">
        <InputNumber v-model="form.timeoutMs" :min="1000" :step="1000" style="width: 100%" />
      </FormItem>
      <FormItem label="标签" help="逗号分隔，如 writing, research">
        <Input v-model="form.tagsText" placeholder="writing, research" allow-clear />
      </FormItem>
      <FormItem label="inputSchema (JSON)" help="后期 Team 黑板映射将按此契约投影变量">
        <Textarea
          v-model="form.inputSchemaText"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          placeholder='[{"name":"topic","dataType":"String","required":true}]'
        />
      </FormItem>
      <FormItem label="outputSchema (JSON)" help="子 Agent 结束后写回 Blackboard 的字段">
        <Textarea
          v-model="form.outputSchemaText"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          placeholder='[{"name":"content","dataType":"String"}]'
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.flow-agent-config-form {
  max-height: min(60vh, 560px);
  overflow: auto;
  padding-right: 4px;
}
</style>
