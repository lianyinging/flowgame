import type { CustomNode } from '@tinyflow-ai/ui'
import { databaseNodeOutputDefs } from './database-node-output-defs'
import { nodeFormHeading } from './node-form-heading'

export const DATABASE_NODE_TYPE = 'databaseNode'

const DATABASE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V7H4V5ZM4 9H20V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9ZM8 13H16V15H8V13ZM8 16H13V18H8V16Z"/></svg>'

export const DEFAULT_DATABASE_SQL = `SELECT *
FROM your_table
<where>
  <if test="requestTimeStart != null and requestTimeStart != ''">
    AND create_time &gt;= #{requestTimeStart}
  </if>
  <if test="requestTimeEnd != null and requestTimeEnd != ''">
    AND create_time &lt;= #{requestTimeEnd}
  </if>
</where>
LIMIT #{limit}`

/** 数据库：入参匹配 MyBatis 风格 SQL 模板中的 #{} / ${} 与动态标签，默认 MySQL */
export const nodeDatabase: CustomNode = {
  title: '数据库',
  description:
    '入参绑定上游变量；SQL 模板支持 MyBatis 写法（#{} 预编译、${} 文本替换）',
  sortNo: 355,
  group: 'base',
  icon: DATABASE_ICON,
  parameters: [],
  parametersEnable: true,
  parametersAddEnable: true,
  outputDefs: databaseNodeOutputDefs,
  outputDefsEnable: true,
  outputDefsAddEnable: false,
  forms: [
    nodeFormHeading('数据源'),
    {
      type: 'select',
      name: 'dbType',
      label: '数据库类型',
      defaultValue: 'mysql',
      options: [{ label: 'MySQL', value: 'mysql' }]
    },
    nodeFormHeading('SQL 模板'),
    {
      type: 'textarea',
      name: 'sqlTemplate',
      label: 'SQL 模板',
      placeholder: '支持 #{param}、${tableName}、<if test="param != null">...</if>',
      defaultValue: DEFAULT_DATABASE_SQL,
      description:
        '#{} 使用预编译参数（安全）；${} 为字符串替换（表名/列名等）；动态标签：<if>、<where>、<foreach>、<choose>/<when>/<otherwise>、<trim>'
    }
  ]
}
