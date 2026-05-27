import { computed, defineComponent, reactive, ref } from 'vue'
import { Button, Form, FormItem } from '@arco-design/web-vue'
import type { FormInstance, ValidatedError } from '@arco-design/web-vue'

import { listToObject, renderFormItem } from '../utils'
import FormProps from './props'

export default defineComponent({
  name: 'ProFrom',
  props: FormProps,
  emits: ['handleSubmit'],
  setup(props, { emit, expose }) {
    const columns = computed(() => props.columns)
    const formRef = ref<FormInstance>()
    const params = reactive<Record<string, string>>(listToObject(columns.value, 'dataIndex', props.params))

    const handleSubmit = (data: { values: Record<string, any>; errors: Record<string, ValidatedError> | undefined }, _ev: Event) => {
      if (!data.errors) {
        // 校验通过
        emit('handleSubmit', data.values)
      }
    }

    const resetFields = () => {
      formRef.value?.resetFields()
    }
    const setFieldsValues = (record: Record<string, any>) => {
      Object.assign(params, record)
    }
    const getFiledsValue = (name: string) => {
      return params[name]
    }

    expose({ resetFields, setFieldsValues, getFiledsValue })
    return {
      params,
      columns,
      getFiledsValue,
      handleSubmit,
      customFooter: props.customFooter,
      formRef
    }
  },
  render() {
    return (
      <Form class='relative' ref='formRef' {...this.$props} onSubmit={this.handleSubmit} model={this.params}>
        {this.columns
          .filter((item) => (typeof item.hideInForm == 'function' ? !item.hideInForm(this.params) : !item.hideInForm))
          .map((item) => (
            <FormItem {...item.formItemProps} label={item.title} field={item.dataIndex}>
              {item.children && item.children.length > 0
                ? item.children
                    .filter((child) => (typeof child.hideInForm == 'function' ? !child.hideInForm(this.params) : !child.hideInForm))
                    .map((child) => (
                      <FormItem {...child.formItemProps} label={child.title} field={child.dataIndex}>
                        {renderFormItem(child, this.params)}
                      </FormItem>
                    ))
                : renderFormItem(item, this.params)}
            </FormItem>
          ))}
        {this.hideFooter ? null : this.$slots?.footer?.() ? (
          this.customFooter ? (
            this.$slots.footer?.()
          ) : (
            <div class='flex border-t-1 border-t-solid border-t-#e5e6eb pt4 items-center justify-end w-full'>{this.$slots.footer?.()}</div>
          )
        ) : (
          <div
            style={{ width: 'calc(100% + 48px)' }}
            class='border-t-1 border-t-solid pt4 px24px w-full absolute bottom-0 -left-24px border-t-#e5e6eb'>
            (
            <div class='flex items-center justify-end'>
              <Button type='primary' htmlType='submit'>
                提交
              </Button>
            </div>
            )
          </div>
        )}
      </Form>
    )
  }
})
