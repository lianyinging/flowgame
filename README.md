# FlowGame（Monorepo）

基于 Vue 3 + Tinyflow 的工作流可视化编辑器。

## 环境要求

- Node.js 18+
- pnpm 8+

## 快速启动（日常开发）

```bash
cd /path/to/flowgame
pnpm install
pnpm dev
```

浏览器打开 <http://127.0.0.1:8009>。

## 仓库结构

```
flowgame/
├── packages/
│   ├── core/          # @flowgame/core — API、节点、补丁、工作流工具
│   └── vue/           # @flowgame/vue — FlowEditor 组件（Arco UI）
├── apps/
│   └── editor/        # flowgame-editor — 官方完整 Demo（含流程列表、知识库页）
└── 开源流程.md
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动编辑器开发服务器（8009） |
| `pnpm build` | 构建 core + vue + editor |
| `pnpm build:core` | 仅构建 `@flowgame/core` |
| `pnpm build:vue` | 仅构建 `@flowgame/vue` |
| `pnpm build:editor` | 仅构建编辑器 |
| `pnpm typecheck` | 各包类型检查 |

## 日常开发改哪里

| 内容 | 目录 |
|------|------|
| 画布逻辑、API、自定义节点 | `packages/core/src` |
| 编辑器 UI（画布页、侧栏、试运行） | `packages/vue/src` |
| 流程列表弹窗、知识库管理页 | `apps/editor/src` |

开发时 **无需先 build**，Vite 直接引用 `packages/core` 与 `packages/vue` 源码。

## 后端联调

1. 启动 flowgame_python（默认 `8008`）
2. `apps/editor/vite.config.ts` 将 `/api` 代理到 `http://127.0.0.1:8008`

## 在别人 Vue 项目中使用（发布后）

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue
```

```ts
// main.ts
import { configureFlowGameClient } from '@flowgame/core'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'

configureFlowGameClient({ baseURL: '/api', onError: (msg) => console.error(msg) })
```

```vue
<script setup>
import { FlowEditor } from '@flowgame/vue'
</script>

<template>
  <FlowEditor api-base-url="/api" style="height: 80vh" />
</template>
```

> 发布到 npm 前，外部项目无法 `pnpm add @flowgame/vue`。本地可用 `workspace:*` 或将来 `pnpm publish`。

### FlowEditor 常用 API

**Props**：`readonly`、`flow-name`、`redis-key`、`title`

**事件**：`@open-flow-list`、`@open-flow-knowledge`、`@saved`、`@executed`

**Expose**：`openFlowFromListPanel`、`reloadFromProps`、`getWorkflow()`

流程列表、知识库配置弹窗在官方 Demo 的 `apps/editor` 中，宿主应用可自行实现后通过 `ref` 调用 `openFlowFromListPanel`。
