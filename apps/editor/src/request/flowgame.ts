import { Message } from '@arco-design/web-vue'
import { configureFlowGameClient } from '@flowgame/core'

configureFlowGameClient({
  baseURL: '/api',
  onError: (message) => {
    Message.error(message)
  }
})

export { flowgameRequest as default, getFlowGameApiBaseURL } from '@flowgame/core'
