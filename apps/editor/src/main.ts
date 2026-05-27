import '@/request/flowgame'
import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'
import '@/components/ProComponent/pro-component.scss'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(ArcoVue)
app.use(router)
app.mount('#app')
