/**
 * 主控协同模板：对齐 experiments/loop_agent/demo_orchestrator.py
 *
 * strategy = supervisor
 * 主控 orchestrator 每步输出 JSON 决策（CALL_AGENT / FINISH）
 * 子 Agent：researcher → planner → writer → reviewer → refiner → publisher
 *
 * 仅契约与搭流蓝图；Team Runtime 就绪后按本配置调度。
 */
import { buildFlowRedisKey } from '../../api/flow-game/constants'
import type { AgentTeamDef, FlowAgentConfig, FlowAgentSchemaField } from '../types'
import { defaultAgentTeamHarness } from '../types'

export const CONTENT_SUPERVISOR_TEAM_KEY = 'team_content_supervisor'
export const CONTENT_SUPERVISOR_AGENT_KEY = 'orchestrator_v1'

/** 单 Agent 对应流程的推荐画布结构 */
export interface AgentFlowBlueprint {
  agentKey: string
  methodKey: string
  title: string
  summary: string
  /** 是否为主控（不进 members 白名单，走 supervisorAgentKey） */
  isSupervisor?: boolean
  outputKey: string
  inputKeys: string[]
  nodes: string[]
  tips: string[]
}

/** 主控决策 JSON 契约（Harness 校验用） */
export const SUPERVISOR_DECISION_SCHEMA = `{
  "thinking": "简短说明为何选这一步（1~3句）",
  "action": "CALL_AGENT 或 FINISH",
  "next_agent": "子Agent名；FINISH 时填 null",
  "focus": "给子Agent的本轮焦点指令（一句话）；FINISH 时可空",
  "done_reason": "仅 FINISH 时填写完成理由"
}`

export const MASTER_SYSTEM_PROMPT = `你是内容创作项目的「主控 Agent（Orchestrator）」。
你不直接写长文，只做调度：根据当前状态，决定下一步调用哪个子 Agent，或宣布完成。

## 可用子 Agent（只能从中选择）
{agent_catalog}

## 决策原则
1. 缺调研 → researcher；缺大纲 → planner；缺正文 → writer
2. 有正文但质量不明/偏低 → reviewer；审核要求修改 → refiner
3. 审核已通过且正文就绪 → publisher；成稿已有且达标 → FINISH
4. 不要无意义地重复同一 Agent；若刚跑过 reviewer 且未通过，优先 refiner
5. 目标是产出高质量文章，不是把每个 Agent 都跑一遍

## 输出契约（必须是单个 JSON，不要 Markdown 代码围栏，不要其它文字）
${SUPERVISOR_DECISION_SCHEMA}

## Few-shot
状态：只有 topic，无 research
→ {"thinking":"还没有调研","action":"CALL_AGENT","next_agent":"researcher","focus":"围绕主题做读者与卖点调研","done_reason":""}

状态：已有 content，review 为「需要修改」
→ {"thinking":"审核未通过，应改稿","action":"CALL_AGENT","next_agent":"refiner","focus":"按最新审核意见逐条修改","done_reason":""}

状态：review 为「审核通过」，尚无 article
→ {"thinking":"质量已达标，组装成稿","action":"CALL_AGENT","next_agent":"publisher","focus":"输出正式 Markdown 成稿","done_reason":""}`

function field(
  name: string,
  dataType: string,
  required = false,
  description = ''
): FlowAgentSchemaField {
  return { name, dataType, required, description }
}

export const CONTENT_SUPERVISOR_BLUEPRINTS: AgentFlowBlueprint[] = [
  {
    agentKey: CONTENT_SUPERVISOR_AGENT_KEY,
    methodKey: 'agent_content_orchestrator',
    title: '主控调度',
    summary: '只做调度决策，输出 CALL_AGENT / FINISH JSON；不写长文',
    isSupervisor: true,
    outputKey: 'decision',
    inputKeys: ['topic', 'requirement', 'status_card', 'recent_trace', 'agent_catalog'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      '输入：黑板状态卡片 status_card + 最近轨迹 recent_trace + 子 Agent 目录',
      'System 使用 MASTER_SYSTEM_PROMPT（注入 agent_catalog）',
      '输出必须是可解析 JSON：action / next_agent / focus / thinking',
      'Harness 校验白名单与 max_same_agent_streak；不信任模型自觉'
    ]
  },
  {
    agentKey: 'researcher',
    methodKey: 'agent_content_researcher',
    title: '选题调研',
    summary: '只做调研简报，不写正文 → research',
    outputKey: 'research',
    inputKeys: ['topic', 'requirement', 'target_words', 'focus'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      'System：资深选题调研员。只输出调研简报，不要写文章正文。',
      '输出：读者画像、卖点/痛点、切入角度、避免的陈词滥调'
    ]
  },
  {
    agentKey: 'planner',
    methodKey: 'agent_content_planner',
    title: '内容策划',
    summary: '只出大纲与标题方向 → outline',
    outputKey: 'outline',
    inputKeys: ['topic', 'requirement', 'research', 'focus'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      'System：内容策划主编。只输出大纲，不要写正文。',
      '输出：选定角度、候选标题、结构小节、语气'
    ]
  },
  {
    agentKey: 'writer',
    methodKey: 'agent_content_writer',
    title: '专栏写手',
    summary: '按大纲写完整初稿 → content',
    outputKey: 'content',
    inputKeys: ['topic', 'requirement', 'target_words', 'research', 'outline', 'focus'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      'System：专栏作者。输出完整初稿正文（含小标题）。',
      '上下文按 input_keys 装箱，勿塞满整个黑板'
    ]
  },
  {
    agentKey: 'reviewer',
    methodKey: 'agent_content_reviewer',
    title: '审核主编',
    summary: '打分并给出通过/修改结论 → review',
    outputKey: 'review',
    inputKeys: ['topic', 'requirement', 'outline', 'content', 'focus'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      '第一行必须是「审核通过」或「需要修改」',
      '维度：开头吸引力、结构、信息密度、文风、契合度；通过标准全部≥8'
    ]
  },
  {
    agentKey: 'refiner',
    methodKey: 'agent_content_refiner',
    title: '改稿作者',
    summary: '按审核意见改稿 → content',
    outputKey: 'content',
    inputKeys: ['topic', 'requirement', 'target_words', 'content', 'review', 'focus'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      '若已审核通过则原样输出正文；否则按意见完整改稿'
    ]
  },
  {
    agentKey: 'publisher',
    methodKey: 'agent_content_publisher',
    title: '发行编辑',
    summary: '组装最终 Markdown 成稿 → article',
    outputKey: 'article',
    inputKeys: ['topic', 'outline', 'content', 'review', 'focus'],
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      '只输出最终 Markdown：# 标题 / 导语引用块 / 正文 / --- / **写在最后**'
    ]
  }
]

const WORKER_SPECS: Array<{
  agentKey: string
  methodKey: string
  name: string
  description: string
  tags: string[]
  inputSchema: FlowAgentSchemaField[]
  outputSchema: FlowAgentSchemaField[]
  timeoutMs?: number
}> = [
  {
    agentKey: 'researcher',
    methodKey: 'agent_content_researcher',
    name: '选题调研',
    description: '只做调研简报，不写正文。对齐 demo_orchestrator.researcher。',
    tags: ['content', 'researcher'],
    inputSchema: [
      field('topic', 'String', true),
      field('requirement', 'String', false),
      field('target_words', 'String', false),
      field('focus', 'String', false, '主控本轮焦点指令')
    ],
    outputSchema: [field('research', 'String', true)]
  },
  {
    agentKey: 'planner',
    methodKey: 'agent_content_planner',
    name: '内容策划',
    description: '只出大纲与标题方向。对齐 demo_orchestrator.planner。',
    tags: ['content', 'planner'],
    inputSchema: [
      field('topic', 'String', true),
      field('requirement', 'String', false),
      field('research', 'String', false),
      field('focus', 'String', false)
    ],
    outputSchema: [field('outline', 'String', true)]
  },
  {
    agentKey: 'writer',
    methodKey: 'agent_content_writer',
    name: '专栏写手',
    description: '按大纲写完整初稿。对齐 demo_orchestrator.writer。',
    tags: ['content', 'writer'],
    inputSchema: [
      field('topic', 'String', true),
      field('requirement', 'String', false),
      field('target_words', 'String', false),
      field('research', 'String', false),
      field('outline', 'String', false),
      field('focus', 'String', false)
    ],
    outputSchema: [field('content', 'String', true)],
    timeoutMs: 180000
  },
  {
    agentKey: 'reviewer',
    methodKey: 'agent_content_reviewer',
    name: '审核主编',
    description: '打分并给出通过/修改结论。对齐 demo_orchestrator.reviewer。',
    tags: ['content', 'reviewer'],
    inputSchema: [
      field('topic', 'String', true),
      field('requirement', 'String', false),
      field('outline', 'String', false),
      field('content', 'String', true),
      field('focus', 'String', false)
    ],
    outputSchema: [field('review', 'String', true)]
  },
  {
    agentKey: 'refiner',
    methodKey: 'agent_content_refiner',
    name: '改稿作者',
    description: '按审核意见改稿。对齐 demo_orchestrator.refiner。',
    tags: ['content', 'refiner'],
    inputSchema: [
      field('topic', 'String', true),
      field('requirement', 'String', false),
      field('target_words', 'String', false),
      field('content', 'String', true),
      field('review', 'String', true),
      field('focus', 'String', false)
    ],
    outputSchema: [field('content', 'String', true)],
    timeoutMs: 180000
  },
  {
    agentKey: 'publisher',
    methodKey: 'agent_content_publisher',
    name: '发行编辑',
    description: '组装最终 Markdown 成稿。对齐 demo_orchestrator.publisher。',
    tags: ['content', 'publisher'],
    inputSchema: [
      field('topic', 'String', true),
      field('outline', 'String', false),
      field('content', 'String', true),
      field('review', 'String', false),
      field('focus', 'String', false)
    ],
    outputSchema: [field('article', 'String', true)]
  }
]

export function buildContentSupervisorAgentConfigs(): FlowAgentConfig[] {
  const now = new Date().toISOString()
  const orchestrator: FlowAgentConfig = {
    agentKey: CONTENT_SUPERVISOR_AGENT_KEY,
    methodKey: 'agent_content_orchestrator',
    redisKey: buildFlowRedisKey('agent_content_orchestrator'),
    name: '主控调度',
    description: '主决策 Agent：只输出 CALL_AGENT/FINISH JSON。对齐 demo_orchestrator 主控。',
    version: '1.0.0',
    published: true,
    timeoutMs: 60000,
    tags: ['content', 'supervisor', 'orchestrator'],
    inputSchema: [
      field('topic', 'String', true),
      field('requirement', 'String', false),
      field('status_card', 'Object', true, '主控看板 JSON：{ key: { empty, type, chars, itemCount?, preview } }'),
      field('recent_trace', 'String', false, '最近调度轨迹'),
      field('agent_catalog', 'String', true, '可用子 Agent 目录')
    ],
    outputSchema: [
      field('decision', 'Object', true, 'action / next_agent / focus / thinking / done_reason'),
      field('action', 'String', false),
      field('next_agent', 'String', false),
      field('focus', 'String', false)
    ],
    updatedAt: now
  }

  const workers = WORKER_SPECS.map(s => ({
    agentKey: s.agentKey,
    methodKey: s.methodKey,
    redisKey: buildFlowRedisKey(s.methodKey),
    name: s.name,
    description: s.description,
    version: '1.0.0',
    published: true,
    timeoutMs: s.timeoutMs ?? 120000,
    tags: s.tags,
    inputSchema: s.inputSchema,
    outputSchema: s.outputSchema,
    updatedAt: now
  }))

  return [orchestrator, ...workers]
}

export function buildContentSupervisorTeamDef(): AgentTeamDef {
  const workers = WORKER_SPECS.map(s => ({
    alias: s.agentKey,
    agentKey: s.agentKey
  }))
  return {
    teamKey: CONTENT_SUPERVISOR_TEAM_KEY,
    name: '内容工厂（主控调度）',
    description: (
      '对齐 demo_orchestrator.py：主控 orchestrator_v1 动态选择 '
      + 'researcher/planner/writer/reviewer/refiner/publisher，或 FINISH。'
    ),
    strategy: 'supervisor',
    members: workers,
    supervisorAgentKey: CONTENT_SUPERVISOR_AGENT_KEY,
    blackboardDefaults: {
      topic: '',
      requirement: '',
      target_words: '800'
    },
    statusCardKeys: [
      'topic',
      'requirement',
      'target_words',
      'research',
      'outline',
      'content',
      'review',
      'article'
    ],
    harness: {
      ...defaultAgentTeamHarness(),
      maxSteps: 12,
      maxSameAgentStreak: 2,
      maxDecisionRetries: 2,
      maxTokenBudget: 200000,
      allowedAgents: workers.map(m => m.alias)
    },
    outputPrimaryKey: 'article',
    updatedAt: new Date().toISOString()
  }
}
