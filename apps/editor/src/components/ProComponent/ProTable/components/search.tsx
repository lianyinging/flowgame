import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import { Button, Form, FormItem, Grid, GridItem, Space } from '@arco-design/web-vue'
import { IconRefresh, IconSearch } from '@arco-design/web-vue/es/icon'
import type { TableProColumn } from '../../types'
import { renderFormItem } from '../../utils'

export default defineComponent({
  props: {
    columns: {
      type: Array as PropType<TableProColumn[]>,
      default: () => []
    },
    form: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['handleSearch'],
  setup(props, { emit }) {
    const formRef = ref<typeof Form | null>(null)
    const collapsed = ref<boolean>(false)
    const params = props.form
    function handleSubmit() {
      emit('handleSearch', { ...params })
    }
    function resetForm() {
      formRef.value?.resetFields()
    }

    function toggleCollapsed() {
      collapsed.value = !collapsed.value
    }
    return {
      params,
      formRef,
      collapsed,
      resetForm,
      toggleCollapsed,
      renderFormItem,
      handleSubmit
    }
  },
  render() {
    return (
      <div class={'border-b-1 mb-2 border-b-#eee border-b-solid'}>
        <Form ref='formRef' onSubmit={this.handleSubmit} autoLabelWidth model={this.params}>
          <div class={'flex items-start flex-wrap justify-between gap-16px'}>
            <div class={'flex-1'}>
              <Grid collapsed={this.collapsed} colGap={16} cols={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 4 }}>
                {this.columns.map((column) => {
                  return (
                    <GridItem key={column.dataIndex}>
                      <FormItem label={column.title} field={column.dataIndex}>
                        {this.renderFormItem(column,this.params)}
                      </FormItem>
                    </GridItem>
                  )
                })}
              </Grid>
            </div>
            <div>
              <FormItem hideLabel>
                <Space>
                  <Button v-slots={{ icon: () => <IconSearch /> }} htmlType={'submit'} type={'primary'}>
                    搜索
                  </Button>
                  <Button onClick={() => this.resetForm()} v-slots={{ icon: () => <IconRefresh /> }}>
                    重置
                  </Button>
                </Space>
              </FormItem>
            </div>
          </div>
        </Form>
      </div>
    )
  }
})
