import type { ButtonProps } from '@arco-design/web-vue'
import type { CSSProperties, PropType } from 'vue'
import { type TableProColumn } from '../types'

type Position = 'top' | 'right' | 'bottom' | 'left'

export default {
  columns: {
    // 表格的列描述信息
    type: Array as PropType<TableProColumn[]>,
    default: () => []
  },
  modelValue:{
    type: Boolean,
    default: false
  },
  placement: {
    type: String as PropType<Position>,
    default: 'right'
  },
  title:{
    type: String,
    defalut: ''
  },
  mask:{
    type: Boolean,
    default: true
  },
  maskClosable:{
    type: Boolean,
    default: true
  },
  closable:{
    type: Boolean,
    default: true
  },
  okText:{
    type: String,
    default: ''
  },
  cancelText:{
    type: String,
    default: ''
  },
  okLoading:{
    type: Boolean,
    default: false
  },
  okButtonProps:{
    type: Object as PropType<ButtonProps>,
    default: () => {}
  },
  cancelButtonProps:{
    type: Object as PropType<ButtonProps>,
    default: () => {}
  },
  unmountOnClose:{
    type: Boolean,
    default: false
  },
  width:{
    type: [Number,String],
    default: 500
  },
  height:{
    type: [Number,String],
    default: 250
  },
  popupContainer:{
    type: [String,HTMLElement],
    default:'body'
  },
  drawerStyle:{
    type: Object as PropType<CSSProperties>,
    default: () => {}
  },
  escToClose:{
    type: Boolean,
    default: true
  },
  renderToBody:{
    type: Boolean,
    default: true
  },
  header:{
    type: Boolean,
    default: true
  },
  footer:{
    type: Boolean,
    default: false
  },
  hideCancel:{
    type: Boolean,
    default: false
  },
  onBeforeOk:Function as PropType<( done: (closed: boolean) => void) => void | boolean | Promise<void | boolean>>,
  onBeforeCancel: Function as PropType<() => boolean>,
  onOk: Function as PropType<(ev:MouseEvent) => void>,
  onCancel: Function as PropType<(ev:MouseEvent|KeyboardEvent) => void>,
  onOpen: Function as PropType<() => void>,
  onClose: Function as PropType<() => void>,
  onBeforeOpen: Function as PropType<() => void>,
  onBeforeClose: Function as PropType<() => void>,
  setFieldsValues: Function as PropType<(data: Record<string, any>)=>void>,
}