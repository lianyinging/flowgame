import type {
  PaginationProps,
  ScrollbarProps,
  TableChangeExtra,
  TableData,
  TableDraggable,
  TableExpandable,
  TableRowSelection
} from '@arco-design/web-vue'
import type { TableBorder, TableOperationColumn } from '@arco-design/web-vue/es/table/interface'
import type { PropType } from 'vue'
import type { JSX } from 'vue/jsx-runtime'
import type { TableProColumn, TableScroll, TableSize, VirtualListProps, positionType } from '../types'

export interface TableColumnCellItem {
  record: TableData
  column: TableProColumn
  rowIndex: number
}

type TableSpanMethod = (data: {
  record: TableData
  column: TableProColumn | TableOperationColumn
  rowIndex: number
  columnIndex: number
}) => { rowspan?: number; colspan?: number } | void

export default {
  params: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  customCloumnClass: {
    type: String,
    default: ''
  },
  hideSearchForm: {
    type: Boolean,
    default: false
  },
  hidePagination:{
    type: Boolean,
    default: true
  },
  hideTools: {
    type: Boolean,
    default: false
  },
  renderToolbar: Function as PropType<(data: any) => JSX.Element>,
  request: Function as PropType<(params: { current: number; pageSize: number }) => Promise<{ list: any[]; total: number }>>,
  columns: {
    // 表格的列描述信息
    type: Array as PropType<TableProColumn[]>,
    default: () => []
  },
  data: {
    // 表格的数据
    type: Array as PropType<TableData[]>,
    default: () => []
  },
  // 是否显示边框
  bordered: [Boolean, Object] as PropType<boolean | TableBorder>,
  hoverable: {
    // 是否显示选中效果
    type: Boolean,
    default: true
  },
  stripe: {
    // 是否开启斑马纹效果
    type: Boolean,
    default: false
  },
  size: {
    type: String as PropType<TableSize>,
    default: 'large'
  },
  tableLayoutFixed: {
    // 表格的 table-layout 属性设置为 fixed，设置为 fixed 后，表格的宽度不会被内容撑开超出 100%。
    type: Boolean,
    default: false
  },
  loading: {
    // 是否为加载中状态
    type: Boolean,
    default: false
  },
  rowSelection: {
    // 表格的行选择器配置
    type: Object as PropType<TableRowSelection>,
    default: () => {}
  },
  expandable: {
    // 表格的展开行配置
    type: Object as PropType<TableExpandable>,
    default: () => {}
  },
  scroll: {
    // 表格的滚动属性配置
    type: Object as PropType<TableScroll>,
    default: () => {}
  },
  pagination: {
    // 分页的属性配置
    type: [Boolean, Object] as PropType<boolean | PaginationProps>,
    default: false
  },
  pagePosition: {
    // 分页选择器的位置
    type: String as PropType<positionType>,
    default: 'br'
  },
  indentSize: {
    // 树形表格的缩进距离
    type: Number,
    default: 16
  },
  rowKey: {
    // 表格行 key 的取值字段
    type: String,
    default: 'id'
  },
  showHeader: {
    // 是否显示表头
    type: Boolean,
    default: true
  },
  virtualListProps: {
    // 传递虚拟列表属性，传入此参数以开启虚拟滚动
    type: Object as PropType<VirtualListProps>,
    default: () => {}
  },
  // 合并单元格的方法
  spanMethod: Function as PropType<TableSpanMethod>,
  spanAll: {
    // 是否让合并方法的索引包含所有
    type: Boolean,
    default: false
  },
  // 数据懒加载函数，传入时开启懒加载功能
  loadMore: Function as PropType<(record: TableData, done: (children?: TableData[]) => void) => void>,
  filterIconAlignLeft: {
    // 筛选图标是否左对齐
    type: Boolean,
    default: false
  },
  hideExpandButtonOnEmpty: {
    // 是否在子树为空时隐藏展开按钮
    type: Boolean,
    default: false
  },
  // 表格拖拽排序的配置
  rowClass: [String, Function] as PropType<string | any[] | Record<string, any> | ((record: TableData, rowIndex: number) => any)>,
  // 表格拖拽排序的配置
  draggable: Object as PropType<TableDraggable>,
  columnResizable: {
    // 是否允许调整列宽
    type: Boolean,
    default: false
  },
  // 显示表尾总结行
  summary: [Boolean, Function] as PropType<boolean | ((params: { columns: TableProColumn[]; data: TableData[] }) => TableData[])>,
  summaryText: {
    // 总结行的首列文字
    type: String,
    default: '合计'
  },
  // 总结行的单元格合并方法
  summarySpanMethod: Function as PropType<
    (data: {
      record: TableData
      column: TableProColumn | TableOperationColumn
      rowIndex: number
      columnIndex: number
    }) => { rowspan?: number; colspan?: number } | void
  >,
  // 已选择的行（受控模式）优先于 rowSelection
  selectedKeys: Array as PropType<string[] | number[]>,
  // 默认已选择的行（非受控模式）优先于 rowSelection
  defaultSelectedKeys: Array as PropType<string[] | number[]>,
  // 显示的展开行、子树（受控模式）优先于 expandable
  expandedKeys: Array as PropType<string[] | number[]>,
  // 默认已选择的行（非受控模式）优先于 rowSelection
  defaultExpandedKeys: Array as PropType<string[] | number[]>,
  defaultExpandAllRows: {
    // 是否默认展开所有的行
    type: Boolean,
    default: false
  },
  stickyHeader: {
    // 是否默认展开所有的行
    type: Boolean,
    default: false
  },
  scrollbar: [Boolean, Object] as PropType<boolean | ScrollbarProps>,
  showEmptyTree: {
    // 是否默认展开所有的行
    type: Boolean,
    default: false
  },
  // 点击展开行时触发
  onExpand: Function as PropType<(rowKey: string | number, record: TableData) => void>,
  // 已展开的数据行发生改变时触发
  onExpandedChange: Function as PropType<(rowKeys: (string | number)[]) => void>,
  // 点击行选择器时触发
  onSelect: Function as PropType<(rowKeys: (string | number)[], rowKey: string | number, record: TableData) => void>,
  // 点击全选选择器时触发
  onSelectAll: Function as PropType<(checked: boolean) => void>,
  // 已选择的数据行发生改变时触发
  onSelectionChange: Function as PropType<(rowKeys: (string | number)[]) => void>,
  // 排序规则发生改变时触发
  onSorterChange: Function as PropType<(dataIndex: string, direction: string) => void>,
  // 过滤选项发生改变时触发
  onFilterChange: Function as PropType<(dataIndex: string, filteredValues: string[]) => void>,
  // 表格分页发生改变时触发
  onPageChange: Function as PropType<(page: number) => void>,
  // 表格每页数据数量发生改变时触发
  onPageSizeChange: Function as PropType<(pageSize: number) => void>,
  // 表格数据发生变化时触发
  onChange: Function as PropType<(data: TableData[], extra: TableChangeExtra, currentData: TableData[]) => void>,
  // 单元格 hover 进入时触发
  onCellMouseEnter: Function as PropType<(record: TableData, column: TableProColumn, ev: Event) => void>,
  // 单元格 hover 退出时触发
  onCellMouseLeave: Function as PropType<(record: TableData, column: TableProColumn, ev: Event) => void>,
  // 点击单元格时触发
  onCellClick: Function as PropType<(record: TableData, column: TableProColumn, ev: Event) => void>,
  // 点击行数据时触发
  onRowClick: Function as PropType<(record: TableData, ev: Event) => void>,
  // 点击表头数据时触发
  onHeaderClick: Function as PropType<(column: TableProColumn, ev: Event) => void>,
  // 调整列宽时触发
  onColumnResize: Function as PropType<(dataIndex: string, width: number) => void>,
  // 双击行数据时触发
  onRowDblclick: Function as PropType<(record: TableData, ev: Event) => void>,
  // 双击单元格时触发
  onCellDblclick: Function as PropType<(record: TableData, column: TableProColumn, ev: Event) => void>,
  // 右击行数据时触发
  onRowContextmenu: Function as PropType<(record: TableData, ev: Event) => void>,
  // 右击单元格时触发
  onCellContextmenu: Function as PropType<(record: TableData, column: TableProColumn, ev: Event) => void>
}
