import { type FieldRule,type ValidatedError } from '@arco-design/web-vue'
import { type PropType } from 'vue'
import { type FieldData } from '@arco-design/web-vue/es/form/interface';
import { type TableProColumn } from '../types'

export type FormRules = Record<string, FieldRule | FieldRule[]>

export default {
  params:{
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  hideFooter:{
    type: Boolean,
    default: false
  },
  columns: {
    // 表格的列描述信息
    type: Array as PropType<TableProColumn[]>,
    default: () => []
  },
  layout: {
    type: String as PropType<'horizontal' | 'vertical' | 'inline'>,
    default: 'horizontal'
  },
  size: {
    type: String as PropType<'mini' | 'small' | 'medium' | 'large'>,
    default: 'medium'
  },
  labelAlign: {
    type: String as PropType<'left' | 'right'>,
    default: 'right'
  },
  labelColProps: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({ span: 5, offset: 0 })
  },
  customFooter:{
    type: Boolean,
    default: false
  },
  wrapperColProps: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({ span: 19, offset: 0 })
  },
  autoLabelWidth: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  id: {
    type: String as PropType<string>,
    default: ''
  },
  scrollToFirstError: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  disabled: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  rules: {
    type: Object as PropType<Record<string, FieldRule | FieldRule[]>>,
    default: () => ({})
  },
  onSubmit: Function as PropType<(data: { values: Record<string, any>; errors: Record<string, ValidatedError> | undefined }, ev: Event) => void>,
  onSubmitSuccess: Function as PropType<(values: Record<string, any>, ev: Event) => void>,
  onSubmitFailed: Function as PropType<(data: { values: Record<string, any>; errors: Record<string, ValidatedError> }, ev: Event) => void>,
  onValidate: Function as PropType<(errors: undefined | Record<string, ValidatedError>) => void>,
  onResetFields: Function as PropType<(field: string | string[]) => void>,
  onSetFields: Function as PropType<(data: Record<string, FieldData>)=>void>,
  resetFields: Function as PropType<()=>void>,
  setFieldsValues: Function as PropType<(data: Record<string, FieldData>)=>void>,
}
