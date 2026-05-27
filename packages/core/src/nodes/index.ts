import type { TinyflowOptions } from '@tinyflow-ai/ui'
import { nodeHtmlTemplate } from './node-html-template'
import { nodeKnowledgePlus } from './node-knowledge'
import { nodeLlmApi } from './node-llmapi'
import { nodeMemoryRead } from './node-memory-read'
import { nodeMemoryWrite } from './node-memory-write'
import { nodeStartApi } from './node-start-api'

/** 流程编排自定义节点注册表，key 与节点 type 一致 */
export const flowGameCustomNodes: NonNullable<TinyflowOptions['customNodes']> = {
  node_start_api: nodeStartApi,
  llmapiNode: nodeLlmApi,
  knowledgeNodePlus: nodeKnowledgePlus,
  memoryWriteNode: nodeMemoryWrite,
  memoryReadNode: nodeMemoryRead,
  htmlTemplateNode: nodeHtmlTemplate
}

export { nodeHtmlTemplate, HTML_TEMPLATE_NODE_TYPE, DEFAULT_HTML_TEMPLATE, HTML_TEMPLATE_PLACEHOLDER } from './node-html-template'
export { nodeMemoryWrite, MEMORY_WRITE_NODE_TYPE } from './node-memory-write'
export { nodeMemoryRead, MEMORY_READ_NODE_TYPE } from './node-memory-read'
export {
  memoryReadNodeDefaultParameters,
  memoryReadLimitParameter,
  memoryContextKeyParameter,
  memoryWriteNodeDefaultParameters
} from './memory-node-parameters'
export { memoryReadNodeOutputDefs, memoryWriteNodeOutputDefs } from './memory-node-output-defs'
export { htmlTemplateNodeDefaultParameters } from './html-template-node-parameters'
export { htmlTemplateNodeOutputDefs } from './html-template-node-output-defs'
