import { Message } from '@arco-design/web-vue'
import { configureFlowGameClient } from '@flowgame/core'

configureFlowGameClient({
  baseURL: '/api',
  redisKeyPrefix: import.meta.env.VITE_FLOWGAME_REDIS_KEY_PREFIX || undefined,
  onError: (message) => {
    Message.error(message)
  }
})

export { flowgameRequest as default, getFlowGameApiBaseURL } from '@flowgame/core'
