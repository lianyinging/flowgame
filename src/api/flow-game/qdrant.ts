import flowgameRequest from '@/request/flowgame'
import type { KbBaseItem } from './kb-collection'

export interface FlowgameQdrantResponse<T = unknown> {
  code: number
  msg: string
  data?: T
}

export interface QdrantCollectionItem {
  collectionName: string
  status?: string
  pointsCount?: number
  vectorSize?: number
  distance?: string
}

export interface QdrantPointItem {
  id: string | number
  payload?: {
    page_content?: string
    metadata?: {
      source_type?: 'qa' | 'document'
      question?: string
      answer?: string
      doc_id?: string
      file_name?: string
      chunk_index?: number
      page?: number
      mime_type?: string
    }
  }
}

export interface QdrantKbDocumentItem {
  docId: string
  fileName: string
  chunkCount: number
  mimeType?: string
  createdAt?: string
}

const QDRANT_BASE = '/v1/flowGame/qdrant'

export function listQdrantCollectionsApi() {
  return flowgameRequest.get<FlowgameQdrantResponse<{ collections: QdrantCollectionItem[], total: number }>>(
    `${QDRANT_BASE}/collections`
  )
}

export function listKbBasesApi() {
  return flowgameRequest.get<FlowgameQdrantResponse<{
    bases: KbBaseItem[]
    total: number
    prefix?: string
    flowgameCollectionCount?: number
  }>>(
    `${QDRANT_BASE}/collections/kb-bases`
  )
}

let kbBasesCache: KbBaseItem[] | null = null
let kbBasesInflight: Promise<KbBaseItem[]> | null = null

/** 进程内复用 kb-bases 列表，避免画布/侧栏/provider 各自打一遍接口 */
export async function listKbBasesCached(force = false): Promise<KbBaseItem[]> {
  if (force) {
    kbBasesCache = null
    kbBasesInflight = null
  }
  if (kbBasesCache)
    return kbBasesCache
  if (!kbBasesInflight) {
    kbBasesInflight = listKbBasesApi()
      .then((res) => {
        kbBasesCache = res.data?.bases ?? []
        return kbBasesCache
      })
      .catch(() => {
        kbBasesCache = []
        return kbBasesCache!
      })
      .finally(() => {
        kbBasesInflight = null
      })
  }
  return kbBasesInflight
}

export function invalidateKbBasesCache() {
  kbBasesCache = null
  kbBasesInflight = null
}

export function listFlowgameKbCollectionsApi() {
  return flowgameRequest.get<FlowgameQdrantResponse<{
    collections: Array<QdrantCollectionItem & { collectionType?: 'qa' | 'document' }>
    total: number
    prefix?: string
  }>>(`${QDRANT_BASE}/collections/flowgame-kb`)
}

export function createKbPairApi(data: {
  collectionName: string
  vectorSize?: number
  distance?: string
}) {
  return flowgameRequest.post<FlowgameQdrantResponse<{
    baseName: string
    qaCollection: string
    docCollection: string
    created: string[]
  }>>(`${QDRANT_BASE}/collections/kb-pair`, data)
}

export function deleteKbPairApi(baseName: string) {
  return flowgameRequest.delete<FlowgameQdrantResponse<{
    baseName: string
    deletedCollections: string[]
  }>>(`${QDRANT_BASE}/collections/kb-pair`, { params: { baseName } })
}

export function getQdrantCollectionApi(collectionName: string) {
  return flowgameRequest.get<FlowgameQdrantResponse<QdrantCollectionItem>>(
    `${QDRANT_BASE}/collections/detail`,
    { params: { collectionName } }
  )
}

export function createQdrantCollectionApi(data: {
  collectionName: string
  vectorSize?: number
  distance?: string
}) {
  return flowgameRequest.post<FlowgameQdrantResponse<QdrantCollectionItem>>(
    `${QDRANT_BASE}/collections`,
    data
  )
}

export function deleteQdrantCollectionApi(collectionName: string) {
  return flowgameRequest.delete<FlowgameQdrantResponse<{ collectionName: string, deleted: boolean }>>(
    `${QDRANT_BASE}/collections`,
    { params: { collectionName } }
  )
}

export function scrollQdrantPointsApi(params: {
  collectionName: string
  limit?: number
  offset?: string
}) {
  return flowgameRequest.get<FlowgameQdrantResponse<{
    collectionName: string
    points: QdrantPointItem[]
    nextOffset?: string | number | null
    count: number
  }>>(`${QDRANT_BASE}/points/scroll`, { params })
}

export function deleteQdrantPointsApi(data: { collectionName: string, pointIds: Array<string | number> }) {
  return flowgameRequest.delete<FlowgameQdrantResponse>(`${QDRANT_BASE}/points`, { data })
}

export function createQdrantQaPointApi(data: {
  collectionName: string
  question: string
  answer: string
}) {
  return flowgameRequest.post<FlowgameQdrantResponse>(`${QDRANT_BASE}/points/qa`, data)
}

export function updateQdrantQaPointApi(data: {
  collectionName: string
  question: string
  answer: string
  pointId: string | number
}) {
  return flowgameRequest.put<FlowgameQdrantResponse>(`${QDRANT_BASE}/points/qa`, data)
}

export function uploadQdrantQaFileApi(collectionName: string, file: File) {
  const formData = new FormData()
  formData.append('collectionName', collectionName)
  formData.append('file', file)
  return flowgameRequest.post<FlowgameQdrantResponse<{ collectionName: string, imported: number }>>(
    `${QDRANT_BASE}/points/upload-qa-file`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

export function uploadQdrantQaTextApi(collectionName: string, text: string) {
  return flowgameRequest.post<FlowgameQdrantResponse<{ collectionName: string, imported: number }>>(
    `${QDRANT_BASE}/points/upload-qa`,
    { collectionName, text }
  )
}

export function uploadQdrantDocumentApi(collectionName: string, file: File) {
  const formData = new FormData()
  formData.append('collectionName', collectionName)
  formData.append('file', file)
  return flowgameRequest.post<FlowgameQdrantResponse<{
    collectionName: string
    docId: string
    fileName: string
    importedChunks: number
    document?: QdrantKbDocumentItem
  }>>(
    `${QDRANT_BASE}/points/upload-document`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

export function listQdrantKbDocumentsApi(collectionName: string) {
  return flowgameRequest.get<FlowgameQdrantResponse<{
    collectionName: string
    documents: QdrantKbDocumentItem[]
    total: number
  }>>(`${QDRANT_BASE}/documents`, { params: { collectionName } })
}

export function deleteQdrantKbDocumentApi(collectionName: string, docId: string) {
  return flowgameRequest.delete<FlowgameQdrantResponse<{
    collectionName: string
    docId: string
    deletedPoints: number
    deleted: boolean
  }>>(`${QDRANT_BASE}/documents`, { params: { collectionName, docId } })
}
