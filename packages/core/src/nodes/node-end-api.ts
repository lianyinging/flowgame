import type { CustomNode } from '@tinyflow-ai/ui'
import { nodeFormHeading } from './node-form-heading'
import { syncEndApiCanvasParams } from './end-api-canvas'

export const END_API_NODE_TYPE = 'node_end_api'

/** 默认输出过程详情（含 nodeExecutions） */
export const DEFAULT_END_API_INCLUDE_EXECUTION_DETAILS = 'true'

const END_API_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.1438V16.0002H18.3391L6 5.1438ZM4 2.932C4 2.07155 5.01456 1.61285 5.66056 2.18123L21.6501 16.2494C22.3423 16.8584 21.9116 18.0002 20.9896 18.0002H6V22H4V2.932Z"/></svg>'

/**
 * Api 接口结束：与「Api接口开始」配套的流程终点。
 *
 * 画布输出参数复用其它自定义节点同款 Tinyflow「参数」UI（名称 + 参数值，可引用上游），
 * 同步写入 outputDefs 供执行；侧栏展示完整输出参数（含类型与参数值）。
 */
export const nodeEndApi: CustomNode = {
  title: 'Api接口结束',
  description:
    'API 流程终点：配置对外返回字段；可关闭过程详情，使 /execute 仅返回自定义输出',
  sortNo: 55,
  group: 'base',
  icon: END_API_ICON,
  /** 画布用 parameters 才能出现「参数值」上游引用下拉（与其它自定义节点一致） */
  parametersEnable: true,
  parametersAddEnable: true,
  /** 关闭原生 outputDefs 表（仅有名称+类型、无引用） */
  outputDefsEnable: false,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('输出设置', 'end-api-output'),
    {
      type: 'select',
      name: 'includeExecutionDetails',
      label: '输出过程详情',
      defaultValue: DEFAULT_END_API_INCLUDE_EXECUTION_DETAILS,
      options: [
        { label: '是（含各节点执行 JSON）', value: 'true' },
        { label: '否（仅自定义输出参数）', value: 'false' }
      ],
      description:
        '关闭后，POST /execute 的 data 仅含下方自定义输出；试运行 /execute/stream 始终完整'
    }
  ],
  render: (parent, node, flow) => {
    syncEndApiCanvasParams(parent, node, flow)
  },
  onUpdate: (parent, node) => {
    syncEndApiCanvasParams(parent, node)
  }
}
