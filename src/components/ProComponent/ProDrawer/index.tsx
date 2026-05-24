import { computed, defineComponent, reactive } from 'vue'
import { Descriptions, DescriptionsItem, Drawer } from '@arco-design/web-vue'
import { formatComponent, listToObject } from '../utils'
import DrawerProps from './props'

export default defineComponent({
  name: 'ProDrawer',
  props: DrawerProps,
  emits: ['update:modelValue'],
  setup(props, { expose,emit }) {
    const columns = computed(() => props.columns)
    const visible = computed(()=>props.modelValue)
    const params = reactive<Record<string, string>>(listToObject(columns.value, 'dataIndex', {}))
    const setFieldsValues = (record: Record<string, any>) => {
      Object.assign(params, record)
    }

    expose({ setFieldsValues })

    const handleCancel = () => {
      console.log('[ handleCancel ] >')
      emit('update:modelValue',false)
    }

    return {
      visible,
      columns,
      params,
      handleCancel
    }
  },
  render() {
    return (
      <Drawer onCancel={()=>this.handleCancel()} v-slots={{ ...this.$slots }} {...this.$props} visible={this.visible}>
        <Descriptions column={1}>
          {this.columns
            .filter((item) => !item.hideInDrawer)
            .map((item,index) => (
              <DescriptionsItem label={item.title}>{formatComponent({record:this.params,column:item,rowIndex:index})}</DescriptionsItem>
            ))}
        </Descriptions>
      </Drawer>
    )
  }
})
