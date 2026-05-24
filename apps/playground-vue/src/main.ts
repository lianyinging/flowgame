import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'
import { configureFlowGameClient } from '@flowgame/core'
import { FlowEditor } from '@flowgame/vue'
import App from './App.vue'

configureFlowGameClient({
  baseURL: '/api',
  onError: (message) => {
    console.error(message)
  }
})

const app = createApp(App)
app.use(ArcoVue)
app.component('FlowEditor', FlowEditor)
app.mount('#app')
