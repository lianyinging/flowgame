import type { FormItemInstance, TableColumnData, TableData } from '@arco-design/web-vue'
import type { VNode } from 'vue'

export type TableSize = 'mini' | 'small' | 'medium' | 'large'

export type positionType = 'tl' | 'top' | 'tr' | 'bl' | 'bottom' | 'br'

export interface TableScroll {
  x?: number | string
  y?: number | string
  minWidth?: number | string
  maxHeight?: number | string
}

export interface VirtualListProps {
  height?: number | string
  threshold?: number
  isStaticItemHeight?: boolean
  fixedSize?: boolean
  estimatedSize?: number
  buffer?: number
}

interface TableColumn extends TableColumnData {
  title?: any
  enum?: {
    [key: string | number]:
      | string
      | {
          value: string
          color?: string
        }
  }
  hideEnumAll?: boolean
  initType?: 'array'
  hideInSearch?: boolean
  hideInDrawer?: boolean
  hideInTable?: boolean
  hideInForm?: boolean | ((record: TableData) => boolean)
  formItemProps?: FormItemInstance['$props']
  renderCell?: (v: any) => any
  renderFormItem?: (record: TableData) => VNode
  renderTableItem?: (record: TableData, rowIndex: number) => HTMLElement
  onChange?: (v: any, record: TableData) => void
}

export type TableProColumn = TableColumn
