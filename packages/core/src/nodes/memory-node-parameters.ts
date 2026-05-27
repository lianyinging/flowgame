import type { Parameter } from '@tinyflow-ai/ui'
import { defaultMemoryWriteParameters } from '../workflow/memory-write-groups'

/** 记忆上下文键：引用值经 MD5 后写入 flow_game:flow_context:{md5} */
export const memoryContextKeyParameter: Parameter = {
  id: 'memory_context_key',
  name: 'contextKey',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'String',
  refType: 'ref',
  required: true,
  description:
    '生成 Redis 键的引用，如 Api 开始 headers.Authorization（过长会自动 MD5）'
}

/** 记忆提取：最多读取条数（0 表示全部） */
export const memoryReadLimitParameter: Parameter = {
  id: 'memory_read_limit',
  name: 'readLimit',
  nameDisabled: true,
  deleteDisabled: true,
  dataType: 'Number',
  refType: 'fixed',
  value: '50',
  description: '从列表尾部读取的最大条数，0 表示读取全部'
}

/** 默认一组：contextKey + memoryValue；侧栏可「添加记忆组」 */
export const memoryWriteNodeDefaultParameters: Parameter[] =
  defaultMemoryWriteParameters() as Parameter[]

export const memoryReadNodeDefaultParameters: Parameter[] = [
  memoryContextKeyParameter,
  memoryReadLimitParameter
]
