import { Input, Select, Tag } from '@arco-design/web-vue'
import type { TableColumnCellItem } from './ProTable/props'
import type { TableProColumn } from './types'

/**
 * @description 格式化显示数据
 * @param record - 每行数据
 * @param columns - 每行属性
 * @param rowIndex - 当前是第几行
 * @returns {string | JSX}
 */
export function formatComponent({ record, column, rowIndex }: TableColumnCellItem) {
  const normalValue = record[column.dataIndex as string]
  const data = column?.enum ? (
    typeof column.enum[normalValue] === 'string' ? (
      column.enum[normalValue]
    ) : (
      <Tag color={(column.enum[normalValue] as { value: string; color?: string })?.color || ''}>
        {(column.enum[normalValue] as { value: string; color?: string })?.value}
      </Tag>
    )
  ) : (
    normalValue
  )
  if (column.dataIndex == 'index') {
    return record.index || rowIndex + 1
  }
  if (column.renderCell) 
return column.renderCell(data)
  if (column.renderTableItem) 
return column.renderTableItem(record, rowIndex)
  return data
}

export function renderFormItem(column: TableProColumn, params: Record<string, string>) {
  return column.enum ? renderSelect(column, params) : column.renderFormItem ? renderCustom(column, params) : renderInput(column, params)
}

function renderSelect(column: TableProColumn, params: Record<string, string>) {
  // 如果是数字类型 转为字符类型
  if (typeof params[column.dataIndex as string] === 'number') {
    params[column.dataIndex as string] = params[column.dataIndex as string].toString()
  }
  return (
    column.enum && (
      <Select onChange={(e)=>{
        column.onChange && column.onChange(e,params)
      }} allowClear defaultValue={''} placeholder={`请选择${column.title}`} v-model={params[column.dataIndex as string]}>
        {column.hideEnumAll ? null : <Select.Option value={''}>全部</Select.Option>}
        {Object.entries(column.enum).map((item) => (
          <Select.Option value={item[0]} key={item[0]}>
            {typeof item[1] === 'string' ? item[1] : item[1].value}
          </Select.Option>
        ))}
      </Select>
    )
  )
}

function renderInput(column: TableProColumn, params: Record<string, string>) {
  return <Input allowClear v-model={params[column.dataIndex as string]} placeholder={`请输入${column.title}`} />
}

function renderCustom(column: TableProColumn, params: Record<string, string>) {
  const Component: any = column.renderFormItem?.(params)
  return <Component v-model={params[column.dataIndex as string]} />
}

export function listToObject(list: TableProColumn[], key: keyof TableProColumn, record: Record<string, any>) {
  const obj = list.reduce((acc: any, item: any) => {
    Object.keys(item).forEach(() => {
      acc[item[key]] = isNull(record[item.dataIndex])
        ? ''
        : Array.isArray(record[item.dataIndex])
          ? record[item.dataIndex]
          : String(record[item.dataIndex])
    })
    return acc
  }, {})
  return obj
}

export function isNull(data: any) {
  if (typeof data === 'undefined' || data === null || data === '') {
    return true
  }
  return false
}
