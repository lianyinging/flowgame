import { getFxToken, getToken } from '@/utils/auth'
import type { FlowGameExecutePayload } from './index'

export type FlowStreamEventName =
  | 'node_started'
  | 'node_finished'
  | 'workflow_finished'
  | 'workflow_error'

const STREAM_PATH = '/api/v1/flowGame/execute/stream'

export interface FlowStreamHandlers {
  onEvent: (event: FlowStreamEventName, data: Record<string, unknown>) => void
  signal?: AbortSignal
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  const token = getToken()
  if (token)
    headers.Authorization = `Bearer ${token}`
  const fxToken = getFxToken()
  if (fxToken)
    headers.FxAuthorization = fxToken
  return headers
}

function parseNdjsonLine(line: string): { event: FlowStreamEventName, data: Record<string, unknown> } | null {
  const trimmed = line.trim()
  if (!trimmed)
    return null
  const parsed = JSON.parse(trimmed) as { event?: string, data?: Record<string, unknown> }
  if (!parsed.event || !parsed.data || typeof parsed.data !== 'object')
    return null
  return {
    event: parsed.event as FlowStreamEventName,
    data: parsed.data
  }
}

/** 单接口 NDJSON 流式执行（试运行实时进度） */
export async function executeFlowGameStreamApi(
  payload: FlowGameExecutePayload,
  handlers: FlowStreamHandlers
): Promise<void> {
  const response = await fetch(STREAM_PATH, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
    signal: handlers.signal
  })

  if (!response.ok) {
    const text = await response.text()
    let message = `请求失败 (${response.status})`
    try {
      const body = JSON.parse(text) as { detail?: string, msg?: string, message?: string }
      message = body.detail || body.msg || body.message || message
    }
    catch {
      if (text)
        message = text.slice(0, 200)
    }
    throw new Error(message)
  }

  const reader = response.body?.getReader()
  if (!reader)
    throw new Error('当前环境不支持流式响应')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const row = parseNdjsonLine(line)
      if (row)
        handlers.onEvent(row.event, row.data)
    }
  }

  const tail = parseNdjsonLine(buffer)
  if (tail)
    handlers.onEvent(tail.event, tail.data)
}
