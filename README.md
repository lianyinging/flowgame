# FlowGame Editor（独立前端）

基于 Vue 3 + Vite + Tinyflow 的工作流可视化编辑器（不含流程列表、知识库管理页，编辑器内仍可使用知识库节点与 Qdrant API）。

## 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

## 快速启动

```bash
cd /path/to/flowgame
pnpm install
pnpm dev
```

浏览器打开 <http://127.0.0.1:5174>。

## 后端联调

1. 启动 `flowgame_python`（默认 `8001` 端口）
2. 本项目的 `vite.config.ts` 已将 `/api` 代理到 `http://127.0.0.1:8001`

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器（5174） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建结果 |

## 目录说明

- `src/views/flow-editor/` — 画布、节点、试运行、侧栏配置
- `src/api/flow-game/` — FlowGame REST / 流式执行 API 封装
