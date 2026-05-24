import { Pagination, Popover, Select, Space, Switch, Table } from '@arco-design/web-vue'
import { IconRefresh, IconSettings } from '@arco-design/web-vue/es/icon'
import { type Slots, defineComponent, reactive, ref, watch } from 'vue'
import { isNull, listToObject } from '../utils'
import TableProColumn from './components/column'
import TableProSearch from './components/search'
import tableProps from './props'
import useLoading from '@/hooks/useLoading'

export default defineComponent({
  name: 'ProTable',
  props: tableProps,
  setup(props, { expose }) {
    const columns = ref(props.columns)
    // 表格加载状态
    const { loading, setLoading } = useLoading(props.loading || true)
    // 筛选表格不隐藏的数据
    const hideInTableColumns = ref((columns.value || [])?.map((item, index) => ({ ...item, currentIndex: index })).filter((col) => !col.hideInTable))

    // 筛选搜索不隐藏的数据
    const searchColumns = ref(props.columns.filter((columns) => !columns.hideInSearch && columns.dataIndex !== 'index'))

    const form = reactive(listToObject(searchColumns.value, 'dataIndex', props.params))

    // 监听columns变化
    watch(
      () => props.columns,
      (newColumns) => {
        columns.value = newColumns || []
        // 更新表格列
        hideInTableColumns.value = columns.value.map((item, index) => ({ ...item, currentIndex: index })).filter((col) => !col.hideInTable)
        // 更新搜索列
        searchColumns.value = columns.value.filter((col) => !col.hideInSearch && col.dataIndex !== 'index')
        // 更新表单数据
        Object.assign(form, listToObject(searchColumns.value, 'dataIndex', props.params))
      },
      { deep: true }
    )

    // 异步请求数据列表
    const tableData = ref<any>([])
    // 总条数
    const total = ref<number>(0)
    // 公共请求参数
    const baseParams = reactive<{
      pageNum: number
      pageSize: number
      [k: string]: any
    }>({
      pageNum: 1,
      pageSize: 10
    })

    const updateList = (list: any) => {
      total.value = list.length
      tableData.value = list.slice((baseParams.pageNum - 1) * baseParams.pageSize, baseParams.pageNum * baseParams.pageSize)
    }

    watch(
      () => props.data,
      (val) => {
        updateList(val)
      }
    )

    // 请求方法
    async function fetchData() {
      setLoading(true)
      if (!props.request) {
        updateList(props.data)
        setLoading(false)
      } else {
        // 合并分页参数、外部透传参数（例如排序）、搜索表单参数
        const params = { ...baseParams, ...(props.params || {}), ...form }
        for (const key in params) {
          if (isNull(params[key])) {
            delete params[key]
          }
        }
        const ret = await props?.request?.(params)
        setLoading(false)
        total.value = ret?.total || 0
        tableData.value = ret?.list || []
      }
    }
    /**
     * @description 渲染表格
     */
    function renderTableColumn(slots: Slots, data: any[]) {
      return slots?.columns?.() ? (
        data && <div class={props.customCloumnClass}>{data.map((item) => slots.columns?.(item))}</div>
      ) : (
        <TableProColumn columns={columns.value} />
      )
    }

    /**
     * 渲染分页器
     */

    function totalComp() {
      return (
        <div class='flex items-center'>
          共&nbsp;<span class='text-#0066FF'>{total.value}</span>&nbsp;条信息
        </div>
      )
    }

    function CustomPagination() {
      return total.value > 0 && this.hidePagination ? (
        <div class={'flex mt-4 items-center justify-between'}>
          {totalComp()}
          <div class={'flex items-center'}>
            <div class='w80px mr-2'>
              <Select
                onChange={(e) => {
                  baseParams.pageNum = 1
                  baseParams.pageSize = e as number
                  fetchData()
                }}
                defaultValue={baseParams.pageSize}
                style='color:#0066FF'>
                <Select.Option value={10}>10</Select.Option>
                <Select.Option value={20}>20</Select.Option>
                <Select.Option value={50}>50</Select.Option>
                <Select.Option value={100}>100</Select.Option>
              </Select>
            </div>
            <Pagination
              onChange={(e) => {
                baseParams.pageNum = e
                fetchData()
              }}
              total={total.value}
              pageSize={baseParams.pageSize}
              current={baseParams.pageNum}
              showTotal={false}>
              {{
                'page-item-step': ({ type }: { type: 'previous' | 'next' }) => (type == 'next' ? '下一页' : '上一页')
              }}
            </Pagination>
          </div>
        </div>
      ) : null
    }

    fetchData()

    function search(searchParams: any) {
      Object.assign(form, searchParams)
      baseParams.pageNum = 1
      fetchData()
    }

    function reload() {
      baseParams.pageNum = 1
      fetchData()
    }

    function refresh() {
      fetchData()
    }

    function getTableParams() {
      const obj = { ...form }
      for (const key in obj) {
        if (isNull(obj[key])) {
          delete obj[key]
        }
      }
      return obj
    }

    function setTableParams(obj: any) {
      Object.assign(form, obj)
    }

    function renderToolbar() {
      return props.renderToolbar?.(baseParams)
    }

    function renderFilterTableHeaderItem() {
      return (
        hideInTableColumns.value &&
        hideInTableColumns.value.map((item) => {
          return (
            <div class='flex mt-2 items-center justify-between'>
              <span>{item.title}</span>
              <Switch
                onChange={(e) => {
                  const ls = [...columns.value]
                  ls[item.currentIndex].hideInTable = !e as boolean
                  columns.value = ls
                  // 更新hideInTableColumns
                  hideInTableColumns.value = columns.value.map((col, index) => ({ ...col, currentIndex: index })).filter((col) => !col.hideInTable)
                }}
                disabled={columns.value.filter((item) => !item.hideInTable).length < 2 && !columns.value[item.currentIndex]?.hideInTable}
                size={'small'}
                defaultChecked={!columns.value[item.currentIndex].hideInTable}
              />
            </div>
          )
        })
      )
    }

    expose({ reload, refresh, getTableParams,setTableParams })
    return {
      renderTableColumn,
      CustomPagination,
      loading,
      search,
      form,
      reload,
      getTableParams,
      setTableParams,
      refresh,
      renderToolbar,
      searchColumns,
      renderFilterTableHeaderItem,
      data: tableData
    }
  },
  render() {
    const column = this.$slots?.columns?.() ? [] : this.columns
    return (
      <div>
        {this.hideSearchForm ? null : (
          <TableProSearch
            key={this.searchColumns.length + '-' + (this.searchColumns.map((c) => c.dataIndex).join(',') || 'empty')}
            form={this.form}
            onHandleSearch={(params) => this.search(params)}
            columns={this.searchColumns}
          />
        )}
        {this.hideTools ? null : (
          <div class='pro-table-toolbar'>
            <div class='pro-table-toolbar__left'>{this.renderToolbar && this.renderToolbar()}</div>
            <div class='pro-table-toolbar__right'>
              <Space>
                <IconRefresh onClick={() => this.reload()} class='cursor-pointer' size={18} />
                <Popover
                  class='min-w200px'
                  v-slots={{ content: () => this.renderFilterTableHeaderItem() }}
                  position={'br'}
                  title={'表头设置'}
                  trigger={'click'}>
                  <IconSettings class='cursor-pointer' size={18} />
                </Popover>
              </Space>
            </div>
          </div>
        )}

        <Table
          {...this.$props}
          loading={this.loading}
          data={this.data}
          columns={column}
          v-slots={{ ...this.$slots, columns: () => this.renderTableColumn(this.$slots, this.data) }}></Table>
        {this.CustomPagination()}
      </div>
    )
  }
})
