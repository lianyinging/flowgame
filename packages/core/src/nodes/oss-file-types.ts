/** OSS 上传文件类型（第一期：由节点配置 fileType 决定 Content-Type 与默认扩展名） */
export const OSS_FILE_TYPES = [
  { value: 'image', label: '图片 (image)', extension: '.png', contentType: 'image/png' },
  { value: 'html', label: 'HTML (html)', extension: '.html', contentType: 'text/html; charset=utf-8' },
  { value: 'txt', label: '文本 (txt)', extension: '.txt', contentType: 'text/plain; charset=utf-8' },
  { value: 'json', label: 'JSON (json)', extension: '.json', contentType: 'application/json; charset=utf-8' },
  { value: 'xml', label: 'XML (xml)', extension: '.xml', contentType: 'application/xml; charset=utf-8' },
  { value: 'css', label: 'CSS (css)', extension: '.css', contentType: 'text/css; charset=utf-8' },
  { value: 'js', label: 'JavaScript (js)', extension: '.js', contentType: 'application/javascript; charset=utf-8' }
] as const

export type OssFileType = (typeof OSS_FILE_TYPES)[number]['value']

export const DEFAULT_OSS_FILE_TYPE: OssFileType = 'txt'

export function getOssFileTypeMeta(type?: string) {
  const found = OSS_FILE_TYPES.find(t => t.value === type)
  return found ?? OSS_FILE_TYPES.find(t => t.value === DEFAULT_OSS_FILE_TYPE)!
}
