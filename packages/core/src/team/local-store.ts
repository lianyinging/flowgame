/**
 * 多 Agent 协同存储：走后端 Redis（/agents、/teams），不再使用 localStorage。
 */
import {
  listTeamAgentsApi,
  listTeamsApi,
  saveTeamAgentApi,
  saveTeamApi,
  deleteTeamApi
} from '../api/flow-game/team'
import type { AgentTeamDef, FlowAgentConfig } from './types'
import { createEmptyAgentConfig, createEmptyAgentTeam } from './types'
import {
  buildContentSupervisorAgentConfigs,
  buildContentSupervisorTeamDef,
  CONTENT_SUPERVISOR_TEAM_KEY
} from './templates/content-supervisor'

function matchAgent(list: FlowAgentConfig[], redisKeyOrMethodKey: string): FlowAgentConfig | null {
  const key = redisKeyOrMethodKey.trim()
  if (!key)
    return null
  return list.find(
    a => a.redisKey === key || a.methodKey === key || a.agentKey === key
  ) ?? null
}

/** 按 redisKey / methodKey / agentKey 读取 Agent 配置 */
export async function getFlowAgentConfig(redisKeyOrMethodKey: string): Promise<FlowAgentConfig | null> {
  const items = (await listTeamAgentsApi()).items || []
  return matchAgent(items, redisKeyOrMethodKey)
}

export async function listFlowAgentConfigs(options?: {
  publishedOnly?: boolean
  keyword?: string
}): Promise<FlowAgentConfig[]> {
  let list = (await listTeamAgentsApi()).items || []
  if (options?.publishedOnly)
    list = list.filter(a => a.published)
  if (options?.keyword?.trim()) {
    const kw = options.keyword.trim().toLowerCase()
    list = list.filter(
      a => a.name.toLowerCase().includes(kw)
        || a.agentKey.toLowerCase().includes(kw)
        || a.methodKey.toLowerCase().includes(kw)
    )
  }
  return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

export async function saveFlowAgentConfig(config: FlowAgentConfig): Promise<FlowAgentConfig> {
  const next: FlowAgentConfig = {
    ...config,
    agentKey: (config.agentKey || config.methodKey).trim(),
    methodKey: config.methodKey.trim(),
    name: config.name.trim() || config.methodKey.trim(),
    updatedAt: new Date().toISOString()
  }
  return saveTeamAgentApi(next)
}

/** 从流程列表写入/同步 Agent 配置到 Redis（存在则更新 redisKey/methodKey/name） */
export async function upsertFlowAgentConfigFromFlow(partial: {
  methodKey: string
  redisKey: string
  name?: string
}): Promise<FlowAgentConfig> {
  const existing = await getFlowAgentConfig(partial.redisKey)
    || await getFlowAgentConfig(partial.methodKey)
  if (existing) {
    return saveFlowAgentConfig({
      ...existing,
      redisKey: partial.redisKey || existing.redisKey,
      methodKey: partial.methodKey || existing.methodKey,
      name: partial.name || existing.name
    })
  }
  return saveFlowAgentConfig(createEmptyAgentConfig(partial))
}

/** @deprecated 使用 upsertFlowAgentConfigFromFlow */
export const ensureFlowAgentConfig = upsertFlowAgentConfigFromFlow

export async function listAgentTeams(options?: { keyword?: string }): Promise<AgentTeamDef[]> {
  let list = (await listTeamsApi()).items || []
  if (options?.keyword?.trim()) {
    const kw = options.keyword.trim().toLowerCase()
    list = list.filter(
      t => t.name.toLowerCase().includes(kw) || t.teamKey.toLowerCase().includes(kw)
    )
  }
  return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

export async function getAgentTeam(teamKey: string): Promise<AgentTeamDef | null> {
  const key = teamKey.trim()
  if (!key)
    return null
  const list = await listAgentTeams()
  return list.find(t => t.teamKey === key) ?? null
}

export async function saveAgentTeam(team: AgentTeamDef): Promise<AgentTeamDef> {
  const next: AgentTeamDef = {
    ...team,
    teamKey: team.teamKey.trim(),
    name: team.name.trim() || team.teamKey,
    updatedAt: new Date().toISOString()
  }
  return saveTeamApi(next)
}

export async function createAgentTeam(partial?: { name?: string }): Promise<AgentTeamDef> {
  return saveAgentTeam(createEmptyAgentTeam(partial))
}

export async function deleteAgentTeam(teamKey: string): Promise<boolean> {
  const res = await deleteTeamApi(teamKey.trim())
  return Boolean(res?.deleted)
}

export interface SeedTeamTemplateResult {
  team: AgentTeamDef
  agents: FlowAgentConfig[]
  /** 是否新写入了 Team（false 表示已存在且未覆盖） */
  teamCreated: boolean
  agentUpserted: number
}

/**
 * 写入内容工厂主控模板到 Redis：1 个 supervisor + 子 Agent + 1 个 Team。
 */
export async function seedContentSupervisorTeam(options?: {
  overwrite?: boolean
}): Promise<SeedTeamTemplateResult> {
  const overwrite = options?.overwrite !== false
  let agentUpserted = 0
  for (const agent of buildContentSupervisorAgentConfigs()) {
    const existing = await getFlowAgentConfig(agent.agentKey)
      || await getFlowAgentConfig(agent.redisKey)
    if (existing && !overwrite)
      continue
    await saveFlowAgentConfig({
      ...(existing || createEmptyAgentConfig({
        methodKey: agent.methodKey,
        redisKey: agent.redisKey,
        name: agent.name
      })),
      ...agent,
      updatedAt: new Date().toISOString()
    })
    agentUpserted += 1
  }

  const draft = buildContentSupervisorTeamDef()
  const existingTeam = await getAgentTeam(CONTENT_SUPERVISOR_TEAM_KEY)
  if (existingTeam && !overwrite) {
    const agents = (await listFlowAgentConfigs()).filter(a =>
      a.agentKey === existingTeam.supervisorAgentKey
      || existingTeam.members.some(m => m.agentKey === a.agentKey)
    )
    return {
      team: existingTeam,
      agents,
      teamCreated: false,
      agentUpserted
    }
  }

  const team = await saveAgentTeam(draft)
  const agents = (await listFlowAgentConfigs()).filter(a =>
    a.agentKey === team.supervisorAgentKey
    || team.members.some(m => m.agentKey === a.agentKey)
  )
  return {
    team,
    agents,
    teamCreated: !existingTeam,
    agentUpserted
  }
}
