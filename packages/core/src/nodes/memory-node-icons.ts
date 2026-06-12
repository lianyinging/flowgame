/** 记忆读取 / 记忆写入节点 SVG（纯 fill，与 Tinyflow 菜单 svg { fill } 一致） */
const SVG = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"'

const ME_TEXT =
  '<text x="12" y="10.8" text-anchor="middle" dominant-baseline="middle" font-size="5.4" font-weight="700" font-family="system-ui,-apple-system,sans-serif">ME</text>'

/** 折角文档（描边用实心条模拟，底边在 arrowEnd 处断开） */
function docBars(arrowEnd: number) {
  return `<path d="M5.5 4.5v15h2.25V4.5z"/><path d="M7.75 4.5H15.5v2.25H7.75z"/><path d="M15.5 4.5L18.5 7.5L15.5 7.5z"/><path d="M16.25 7.75V19.5h2.25V7.75z"/><path d="M5.5 17.25H${arrowEnd}v2.25H5.5z"/>`
}

/** 记忆读取：ME 文档 + 向右箭头 */
export const MEMORY_READ_NODE_ICON = `<svg ${SVG}>${ME_TEXT}${docBars(11.5)}<path d="M11.5 13.25H16.5L21 15.5L16.5 17.75H11.5z"/></svg>`

/** 记忆写入：ME 文档 + 向左箭头 */
export const MEMORY_WRITE_NODE_ICON = `<svg ${SVG}>${ME_TEXT}${docBars(11.5)}<path d="M11.5 17.25H18.5v2.25H11.5z"/><path d="M18.5 13.25H13.25L8.5 15.5L13.25 17.75H18.5z"/></svg>`
