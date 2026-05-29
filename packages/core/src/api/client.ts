import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

export interface FlowgameApiResponse<T = unknown> {
  code: number
  msg?: string
  message?: string
  data?: T
}

export interface FlowGameClientOptions {
  baseURL?: string
  timeout?: number
  onError?: (message: string) => void
}

let onErrorHandler: (message: string) => void = (msg) => {
  console.error(msg)
}

let apiBaseURL = '/api'

export function configureFlowGameClient(options: FlowGameClientOptions = {}) {
  if (options.baseURL !== undefined)
    apiBaseURL = options.baseURL.replace(/\/$/, '') || '/api'
  if (options.onError)
    onErrorHandler = options.onError
  flowgameRequest.defaults.baseURL = apiBaseURL
  if (options.timeout !== undefined)
    flowgameRequest.defaults.timeout = options.timeout
}

export function getFlowGameApiBaseURL() {
  return apiBaseURL
}

/** 响应拦截器返回 `response.data`（业务 envelope），而非 AxiosResponse */
export type FlowgameRequest = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> & {
  get<T = FlowgameApiResponse>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = FlowgameApiResponse>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = FlowgameApiResponse>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = FlowgameApiResponse>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const flowgameRequest = axios.create({
  baseURL: apiBaseURL,
  timeout: 120000
}) as FlowgameRequest

flowgameRequest.interceptors.response.use(
  (response) => {
    const body = response.data as FlowgameApiResponse
    if (body?.code !== undefined && body?.code !== 200) {
      onErrorHandler(body?.msg || body?.message || '请求失败')
      return Promise.reject(body)
    }
    return body as typeof response.data
  },
  (error) => {
    const detail = error.response?.data?.detail
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('；')
        : error.response?.data?.message || error.message || '请求失败'
    onErrorHandler(message)
    return Promise.reject(error)
  }
)

export default flowgameRequest
