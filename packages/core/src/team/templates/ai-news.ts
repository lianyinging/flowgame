/**
 * 路径 C：对齐 experiments/loop_agent/demo_ai_news.py
 * sequential Team = scout → fetcher → curator → writer
 *
 * 本文件只提供 Agent / Team 契约与搭流蓝图；执行依赖后续 Team Runtime
 * 与四个已发布流程（methodKey 与下方一致）。
 */
import { buildFlowRedisKey } from '../../api/flow-game/constants'
import type { AgentTeamDef, FlowAgentConfig } from '../types'
import { defaultAgentTeamHarness } from '../types'

export const AI_NEWS_TEAM_KEY = 'team_ai_news'

export const AI_NEWS_CURATOR_SYSTEM = (
  '你是资深资讯主编。'
  + '只基于给定素材判断，禁止编造不存在的链接或事实。'
  + '紧扣用户主题，优先最近、高信号、可验证的内容。'
)

export const AI_NEWS_WRITER_SYSTEM = (
  '你是资深撰稿人。只输出 Markdown 正文，不要前言后语。'
  + '引用必须带来源链接。严格按「整理要求」组织段落。'
)

/** 单 Agent 对应流程的推荐画布结构（人工搭流用） */
export interface AgentFlowBlueprint {
  agentKey: string
  methodKey: string
  title: string
  summary: string
  /** 推荐节点顺序（类型名，非 JSON） */
  nodes: string[]
  /** 侧栏 / LLM 配置提示 */
  tips: string[]
}

export const AI_NEWS_FLOW_BLUEPRINTS: AgentFlowBlueprint[] = [
  {
    agentKey: 'scout',
    methodKey: 'agent_news_scout',
    title: '资讯侦察',
    summary: '按 topic 搜索候选链接（Google News / DuckDuckGo）',
    nodes: ['开始(API)', '网页搜索', '结束'],
    tips: [
      '开始参数：topic(String)、requirement(String，可选)',
      '网页搜索 keyword 引用 topic；limit 建议 10～12',
      '输出 documents（或 candidates）供下游 fetcher'
    ]
  },
  {
    agentKey: 'fetcher',
    methodKey: 'agent_news_fetcher',
    title: '正文抓取',
    summary: '对候选 URL 抓取正文（Jina → 降级）',
    nodes: ['开始(API)', '循环(对 documents)', '网页抓取', '结束'],
    tips: [
      '输入：documents / candidates（含 url、title）',
      '网页抓取 urls 可直接引用 documents（或 url 数组）；也可循环逐条抓取；max_chars≈6000',
      '输出 documents（抓取正文列表）；篇数建议 ≤8（对齐 demo --max-articles）'
    ]
  },
  {
    agentKey: 'curator',
    methodKey: 'agent_news_curator',
    title: '资讯策展',
    summary: 'LLM 去重聚类，产出 themes / top_stories JSON',
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      '输入：topic、requirement、articles',
      `System：${AI_NEWS_CURATOR_SYSTEM}`,
      'User：附素材 JSON，要求输出 themes / top_stories / noise_ids / editor_notes（无代码围栏）',
      '输出字段：curated_json'
    ]
  },
  {
    agentKey: 'writer',
    methodKey: 'agent_news_writer',
    title: '简报写稿',
    summary: 'LLM 生成结构化 Markdown 简报',
    nodes: ['开始(API)', 'LLM API', '结束'],
    tips: [
      '输入：topic、requirement、articles、curated_json',
      `System：${AI_NEWS_WRITER_SYSTEM}`,
      '输出须含：标题、按要求整理的要点、分主题深读、趋势观察、来源列表',
      '输出字段：report_md'
    ]
  }
]

function field(
  name: string,
  dataType: string,
  required = false,
  description = ''
) {
  return { name, dataType, required, description }
}

export function buildAiNewsAgentConfigs(): FlowAgentConfig[] {
  const now = new Date().toISOString()
  const specs: Array<Omit<FlowAgentConfig, 'redisKey' | 'updatedAt'> & { methodKey: string }> = [
    {
      agentKey: 'scout',
      methodKey: 'agent_news_scout',
      name: '资讯侦察',
      description: 'RSS/网页搜索汇总候选链接。对齐 demo_ai_news.ScoutAgent。',
      version: '1.0.0',
      published: true,
      timeoutMs: 90000,
      tags: ['ai-news', 'scout', 'search'],
      inputSchema: [
        field('topic', 'String', true, '检索主题，建议简短，如 AI / 新能源汽车'),
        field('requirement', 'String', false, '整理要求；可与 topic 拆分传入')
      ],
      outputSchema: [
        field('documents', 'Array', true, '候选链接列表（title/url/snippet/source）'),
        field('search_query', 'String', false, '实际检索词（可选）')
      ]
    },
    {
      agentKey: 'fetcher',
      methodKey: 'agent_news_fetcher',
      name: '正文抓取',
      description: '抓取正文。对齐 demo_ai_news.FetcherAgent（Jina / requests）。',
      version: '1.0.0',
      published: true,
      timeoutMs: 180000,
      tags: ['ai-news', 'fetcher', 'fetch'],
      inputSchema: [
        field('documents', 'Array', true, '上游 scout 的候选链接'),
        field('max_articles', 'Number', false, '最多抓取篇数，默认 8')
      ],
      outputSchema: [
        field('articles', 'Array', true, '正文列表（title/url/body/source/published）')
      ]
    },
    {
      agentKey: 'curator',
      methodKey: 'agent_news_curator',
      name: '资讯策展',
      description: '去重聚类、挑重点。对齐 demo_ai_news.CuratorAgent。',
      version: '1.0.0',
      published: true,
      timeoutMs: 120000,
      tags: ['ai-news', 'curator', 'llm'],
      inputSchema: [
        field('topic', 'String', true, '关注主题'),
        field('requirement', 'String', false, '整理要求'),
        field('articles', 'Array', true, 'fetcher 产出的正文')
      ],
      outputSchema: [
        field('curated_json', 'String', true, '策展 JSON（themes / top_stories / …）')
      ]
    },
    {
      agentKey: 'writer',
      methodKey: 'agent_news_writer',
      name: '简报写稿',
      description: '生成 Markdown 简报。对齐 demo_ai_news.WriterAgent。',
      version: '1.0.0',
      published: true,
      timeoutMs: 120000,
      tags: ['ai-news', 'writer', 'llm'],
      inputSchema: [
        field('topic', 'String', true, '关注主题'),
        field('requirement', 'String', false, '整理要求'),
        field('articles', 'Array', true, '正文素材'),
        field('curated_json', 'String', true, '策展结果')
      ],
      outputSchema: [
        field('report_md', 'String', true, '最终 Markdown 简报')
      ]
    }
  ]

  return specs.map((s) => ({
    ...s,
    redisKey: buildFlowRedisKey(s.methodKey),
    updatedAt: now
  }))
}

export function buildAiNewsTeamDef(): AgentTeamDef {
  const members = AI_NEWS_FLOW_BLUEPRINTS.map(b => ({
    alias: b.agentKey,
    agentKey: b.agentKey
  }))
  return {
    teamKey: AI_NEWS_TEAM_KEY,
    name: '资讯简报 Team',
    description: (
      '对齐 demo_ai_news.py：scout → fetcher → curator → writer（sequential）。'
      + '黑板默认 topic/requirement；主输出 report_md。'
    ),
    strategy: 'sequential',
    members,
    blackboardDefaults: {
      topic: '人工智能',
      requirement: '按段落整理重要信息，结构清晰，标注来源',
      max_articles: '8'
    },
    statusCardKeys: [
      'topic',
      'requirement',
      'documents',
      'articles',
      'report_md'
    ],
    harness: {
      ...defaultAgentTeamHarness(),
      maxSteps: 8,
      maxTokenBudget: 200000,
      allowedAgents: members.map(m => m.alias)
    },
    outputPrimaryKey: 'report_md',
    updatedAt: new Date().toISOString()
  }
}
