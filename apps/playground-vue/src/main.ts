import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'
import { configureFlowGameClient } from '@flowgame/core'
import App from './App.vue'

configureFlowGameClient({
  baseURL: '/api',
  // 测试用前缀（与 cm-pinyou 类似，可改成任意名字）
  redisKeyPrefix: 'flowgame_demo:',
  qdrantKbPrefix: 'flowgame_demo_',
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
