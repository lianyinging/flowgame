import { defineComponent } from 'vue'
import { TableColumn as Td } from '@arco-design/web-vue'
import type { PropType } from 'vue'
import type { TableProColumn } from '../../types'
import type { TableColumnCellItem } from '../props'
import { formatComponent } from '../../utils'

export default defineComponent({
  props: {
    columns: {
      type: Array as PropType<TableProColumn[]>,
      default: () => []
    }
  },
  setup(props,{slots}) {
    /**
     * @description 渲染表格项
     * @returns {JSX}
     */
    function renderTableColumnCell() {
      return (
        props.columns &&
        props.columns.filter(item=>!item.hideInTable).map((columns) => {
          return (
            <Td {...columns}>
              {{
                ...slots,
                cell: ({ record, rowIndex }: TableColumnCellItem) => formatComponent({ record, column: columns, rowIndex })
              }}
            </Td>
          )
        })
      )
    }

    
    return {
      renderTableColumnCell
    }
  },
  render() {
    return this.renderTableColumnCell()
  }
})
