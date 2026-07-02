import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import {
  mountStateMachineCanvasControls,
  updateStateMachineCanvasControls
} from './state-machine-canvas'
import {
  DEFAULT_STATE_EXPIRE_SECONDS,
  DEFAULT_STATE_KEY_TEMPLATE,
  DEFAULT_STATE_NAMESPACE,
  stateMachineWriteParameters
} from './state-node-parameters'
import { stateMachineNodeOutputDefs } from './state-node-output-defs'
import { STATE_MACHINE_NODE_ICON } from './state-node-icons'

export const STATE_MACHINE_NODE_TYPE = 'stateMachineNode'

/** 状态机：Redis 读写实体状态（write / read / delete / update） */
export const nodeStateMachine: CustomNode = {
  title: '状态机',
  description:
    '通用 Redis 状态存储：写入、读取、删除、更新；支持 Key 模板、TTL 与 payload 深合并',
  sortNo: 362,
  group: 'base',
  icon: STATE_MACHINE_NODE_ICON,
  parameters: stateMachineWriteParameters,
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: stateMachineNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('Redis 状态'),
    {
      type: 'input',
      name: 'namespace',
      label: '命名空间',
      placeholder: DEFAULT_STATE_NAMESPACE,
      defaultValue: DEFAULT_STATE_NAMESPACE,
      description: '业务域隔离，如 pricing-report、import-job'
    },
    {
      type: 'input',
      name: 'keyTemplate',
      label: 'Key 模板',
      placeholder: DEFAULT_STATE_KEY_TEMPLATE,
      defaultValue: DEFAULT_STATE_KEY_TEMPLATE,
      description: '支持 {{entityKey}}、{{taskId}} 等，与输入参数名一致'
    },
    {
      type: 'input',
      name: 'expireSeconds',
      label: '过期时间（秒）',
      placeholder: '0 表示不过期',
      defaultValue: DEFAULT_STATE_EXPIRE_SECONDS,
      description: 'write/update 生效；防止超时未更新导致脏状态'
    },
    {
      type: 'select',
      name: 'refreshTtl',
      label: '写入时刷新 TTL',
      defaultValue: 'true',
      options: [
        { label: '是', value: 'true' },
        { label: '否', value: 'false' }
      ]
    },
    {
      type: 'input',
      name: 'defaultStatus',
      label: '读取默认 status',
      placeholder: 'unknown',
      defaultValue: 'unknown',
      description: 'read 模式：Key 不存在时的 status'
    },
    {
      type: 'select',
      name: 'failIfMissing',
      label: 'Key 不存在时报错',
      defaultValue: 'false',
      options: [
        { label: '否（读取返回 exists=false）', value: 'false' },
        { label: '是', value: 'true' }
      ]
    },
    {
      type: 'select',
      name: 'returnLastState',
      label: '删除前返回最后状态',
      defaultValue: 'true',
      options: [
        { label: '是', value: 'true' },
        { label: '否', value: 'false' }
      ]
    }
  ],
  render: (parent, node, flow) => {
    mountStateMachineCanvasControls(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    updateStateMachineCanvasControls(parent, node)
  }
}
