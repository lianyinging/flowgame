import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'
import { configureFlowGameClient } from '@flowgame/core'
import App from './App.vue'

configureFlowGameClient({
  baseURL: '/api',
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
