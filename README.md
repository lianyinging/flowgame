<p align="center">
  <a href="https://flowgame.mgdeep.com" target="_blank">
    <img
      src="https://image.cscmgg.com/wechatMiniprogramImages/adminImage/bannerImage/20260601/blstxodlnxg66p.png"
      alt="FlowGame logo"
      width="300"
    />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@flowgame/vue"><img src="https://img.shields.io/npm/v/@flowgame/vue?label=npm" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" />
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="license" /></a>
</p>

简体中文 | [English](./README.en-US.md)

- **FlowGame** 在 [Tinyflow](https://github.com/tinyflow-ai/tinyflow) 画布引擎之上，面向 **AI 工作流** 做了深度扩展：保留 Tinyflow 的拖拽编排体验，并**新增一批自定义节点**，同时配套 **Python 后端** 完成真实执行与数据持久化。

- 前端通过 `@flowgame/vue` 的 `FlowEditor` 嵌入任意 Vue 3 项目；**流程试运行、保存到 Redis、知识库向量检索** 等能力由独立后端 **[flowgame_python](https://github.com/lianyinging/flowgame_python)**（FastAPI + Redis + Qdrant）提供，前后端分离、可按需 Docker 部署。

**在 Tinyflow 基础上新增的节点**（`@flowgame/core` 注册）：

| 节点 | 说明 |
|------|------|
| **Start API** | 工作流 HTTP 入口，定义对外 API 路径与入参 |
| **模型调用（LLM API）** | 配置 API Key、接口地址与模型名，调用大模型 |
| **知识库检索+** | 关联 Qdrant 知识库，支持检索增强（RAG） |
| **记忆写入 / 读取** | 跨节点、跨轮次读写会话上下文 |
| **HTML 模板** | 用模板渲染结构化 HTML 输出 |

## 核心能力

- **基于 Tinyflow 扩展**：复用成熟画布与连线能力，并注册 Start API、模型调用、知识库+、记忆读写、HTML 模板等自定义节点。
- **Python 后端驱动执行**：flowgame_python 负责解析工作流、调用 LLM/HTTP、读写 Redis 与 Qdrant，支持同步与流式试运行。
- **开箱即用组件**：`FlowEditor` 一行接入，内置流程列表、知识库配置、节点详情面板与试运行入口。
- **框架分层清晰**：`@flowgame/core` 负责节点与 API 客户端；`@flowgame/vue` 负责 Vue 3 UI，便于二次定制。
- **多种部署方式**：npm 接入、Monorepo 本地开发、Docker 一键部署（前端 + API + Redis + Qdrant）。

---

## 快速开始（npm install）

### 环境要求

| 工具 | 版本                                                                               |
|------|----------------------------------------------------------------------------------|
| Node.js | **18+**                                                                          |
| pnpm / npm / yarn | 任选其一（推荐pnpm）                                                                     |
| Python 后端（完整功能） | **3.10+**，见 [flowgame_python](https://github.com/lianyinging/flowgame_python) |

### 1. 创建 Vue 3 项目

```bash
pnpm create vite my-flow-app --template vue-ts
cd my-flow-app
pnpm install
```

### 2. 安装 FlowGame 与 peer 依赖

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

当前 npm 版本：**0.1.6**（可用 `npm view @flowgame/vue version` 确认）。

### 3. 配置入口与样式

**`src/main.ts`**

```ts
import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'
import { configureFlowGameClient } from '@flowgame/core'
import App from './App.vue'

configureFlowGameClient({
  baseURL: '/api',
  // 多项目共用 Redis / Qdrant 时可配置（须与 flowgame_python .env 一致）
  // redisKeyPrefix: 'myapp:',
  // qdrantKbPrefix: 'myapp_',
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
```

**`src/App.vue`**

```vue
<script setup lang="ts">
import { FlowEditor } from '@flowgame/vue'
</script>

<template>
  <div class="flow-editor-host">
    <FlowEditor />
  </div>
</template>

<style>
html, body, #app { margin: 0; height: 100%; overflow: hidden; }
</style>
```

**`vite.config.ts`**（开发环境代理后端）

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true
      }
    }
  }
})
```

### 4. 启动后端（可选，完整功能需要）

```bash
# 在 flowgame_python 仓库
python run.py   # 默认 http://127.0.0.1:8008
```

### 5. 启动前端

```bash
pnpm dev
```

浏览器打开开发地址即可使用编辑器。未启动后端时，画布可正常编辑；**保存、试运行、流程列表、知识库** 等接口会失败，属正常现象。

---

## 在 Vue 项目里使用

### 最小接入

安装依赖并按上一节配置 `main.ts`、`App.vue`、`vite.config.ts` 后，在页面中挂载 `<FlowEditor />` 即可。

### FlowEditor 常用 API

| 类型 | 名称 | 说明 |
|------|------|------|
| Prop | `readonly` | 只读查看模式 |
| Prop | `flow-name` / `redis-key` | 从 Redis 加载指定流程 |
| Prop | `builtin-business-modals` | 是否内置流程列表/知识库弹窗（默认 `true`） |
| Event | `saved` | 保存成功，`{ flowName }` |
| Event | `executed` | 试运行结束，`{ phase: 'success' \| 'error' }` |
| Event | `open-flow-list` / `open-flow-knowledge` | `builtin-business-modals=false` 时触发自定义弹窗 |
| Expose | `getWorkflow()` | 获取当前工作流 JSON |
| Expose | `openFlowFromListPanel(payload)` | 从列表打开/新建流程 |

完整 Props / 事件说明见 [packages/vue/README.md](packages/vue/README.md)。

### 自定义后端地址

生产环境可在 Nginx 将 `/api` 反代到 Python 服务，前端保持 `baseURL: '/api'`。若 API 与前端不同域，在 `configureFlowGameClient` 中设置完整 `baseURL`，并配置 CORS。

### 在本仓库开发（贡献者）

```bash
git clone https://github.com/lianyinging/flowgame.git
cd flowgame
pnpm install
pnpm dev          # 官方编辑器 → http://127.0.0.1:8009
pnpm dev:playground  # 最小示例 → http://127.0.0.1:8010
```

开发时 Vite 直接引用 `packages/*/src`，保存即热更新，**无需先 build**。

---

## 项目结构

```
flowgame/
├── packages/
│   ├── core/              # @flowgame/core — 节点、画布 patch、HTTP API 客户端
│   └── vue/               # @flowgame/vue — FlowEditor、侧栏、弹窗
├── apps/
│   ├── editor/            # 官方 Demo（pnpm dev → 8009）
│   └── playground-vue/    # 最小接入示例（8010）
├── deploy/                # Docker / Nginx 部署配置
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── nginx.conf
├── README.md              # 中文说明（本文件）
├── README.en-US.md        # English
├── Docker部署.md          # Docker 详细指南
└── CHANGELOG.md           # 可发布包版本记录
```

| 你想改… | 目录 |
|---------|------|
| 自定义节点、画布逻辑、API | `packages/core/src` |
| 编辑器 UI、属性面板 | `packages/vue/src` |
| 官方 Demo 业务页 | `apps/editor/src` |

**相关仓库**

| 仓库 | 说明 |
|------|------|
| [flowgame](https://github.com/lianyinging/flowgame) | 本仓库（前端 Monorepo） |
| [flowgame_python](https://github.com/lianyinging/flowgame_python) | Python 执行器、Redis、Qdrant API |

**默认端口**

| 服务 | 地址 |
|------|------|
| 官方编辑器 | http://127.0.0.1:8009 |
| Playground | http://127.0.0.1:8010 |
| Python API | http://127.0.0.1:8008 |
| API 文档 | http://127.0.0.1:8008/docs |

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 找不到 `@flowgame/core` | 需同时安装 `@flowgame/core` 与 `@flowgame/vue` |
| 画布无样式 / 节点图标巨大 | 确认引入 `@tinyflow-ai/ui/dist/index.css` 与 `@flowgame/vue/style.css` |
| 升级 npm 包后行为未变 | 删除 `node_modules/.vite` 后重启 `pnpm dev` |
| 控制台 `form-data` 无 default export | 勿随意 `optimizeDeps.exclude` @flowgame 包；清 `.vite` 缓存 |
| 试运行 / 保存失败 | 启动 flowgame_python，Vite 代理端口与后端一致（默认 8008） |
| Arco 组件报错 | `app.use(ArcoVue)` 且引入 `@arco-design/web-vue/dist/arco.css` |
| 流程列表只弹 Message | 确保 `@flowgame/vue` 为较新版本，且后端 `/api` 可用 |
| Docker 访问 8009 连接被重置 | 确认 `nginx.conf` 监听 **8009**，端口映射为 `8009:8009` |

---

## Docker 部署

适合在已安装 Docker 的服务器上部署 **前端 + API + Redis + Qdrant** 完整环境。

### 目录要求

`flowgame` 与 `flowgame_python` 需**并列**放在同一父目录：

```
/opt/flowgame/
├── flowgame/           # 本仓库
│   └── deploy/
└── flowgame_python/    # Python 后端
```

### 快速部署

```bash
mkdir -p /opt/flowgame && cd /opt/flowgame
git clone https://github.com/lianyinging/flowgame.git flowgame
git clone https://github.com/lianyinging/flowgame_python.git flowgame_python

cd flowgame/deploy
cp .env.example .env    # 按需修改端口等
docker compose up -d --build
```

### 验证

```bash
curl http://127.0.0.1:8008/health
curl -I http://127.0.0.1:8009
```

浏览器访问：**http://\<服务器IP\>:8009**（API 文档：**http://\<服务器IP\>:8009/docs**）。

| 容器 | 默认宿主机端口 | 作用 |
|------|----------------|------|
| `web` | 8009 | Nginx 托管编辑器，`/api` 反代到后端 |
| `api` | 8008 | FastAPI 工作流执行 |
| `redis` | 6379 | 流程存储 |
| `qdrant` | 6333 | 向量知识库 |

完整步骤、环境变量、更新与排错见 **[Docker部署.md](Docker部署.md)**。

---

## 许可与第三方依赖

FlowGame（`@flowgame/core`、`@flowgame/vue`）采用 **[Apache License 2.0](LICENSE)**。

Peer 依赖 `@tinyflow-ai/ui`（LGPL-3.0-or-later）、`@arco-design/web-vue` 等第三方组件使用各自许可证，分发前请确认兼容性。
