import type { TinyflowOptions } from '@tinyflow-ai/ui'
import { nodeKnowledgePlus } from './node-knowledge'
import { nodeLlmApi } from './node-llmapi'
import { nodeStartApi } from './node-start-api'

/** 流程编排自定义节点注册表，key 与节点 type 一致 */
export const flowGameCustomNodes: NonNullable<TinyflowOptions['customNodes']> = {
  node_start_api: nodeStartApi,
  llmapiNode: nodeLlmApi,
  knowledgeNodePlus: nodeKnowledgePlus
}
