import { Message } from '@arco-design/web-vue'
import axios from 'axios'

export interface FlowgameApiResponse<T = unknown> {
  code: number
  msg?: string
  message?: string
  data?: T
}

const instance = axios.create({
  baseURL: '/api',
  timeout: 120000
})

instance.interceptors.response.use(
  (response) => {
    const body = response.data as FlowgameApiResponse
    if (body?.code !== undefined && body?.code !== 200) {
      Message.error(body?.msg || body?.message || '请求失败')
      return Promise.reject(body)
    }
    return body
  },
  (error) => {
    const detail = error.response?.data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('；')
        : error.response?.data?.message || error.message || '请求失败'
    Message.error(message)
    return Promise.reject(error)
  }
)

export default instance
