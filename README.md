# FlowGame

基于 [Tinyflow](https://github.com/tinyflow-ai/tinyflow) 的 **AI 工作流可视化编排** 前端 Monorepo。提供可发布的 `@flowgame/core` 与 `@flowgame/vue`，他人可在自己的 Vue 3 项目中 `pnpm install` 后接入画布与编辑器；工作流执行、流程存储、知识库检索由独立 Python 服务 **flowgame_python** 提供。

---

## 目录

- [你能用它做什么](#你能用它做什么)
- [环境要求](#环境要求)
- [相关仓库](#相关仓库)
- [一、快速开始（在本仓库开发）](#一快速开始在本仓库开发)
- [二、启动后端（完整功能）](#二启动后端完整功能)
- [三、在别人 Vue 项目里使用（推荐路径）](#三在别人-vue-项目里使用推荐路径)
- [四、本地 tgz 模拟 npm 安装](#四本地-tgz-模拟-npm-安装)
- [五、用 flowgame-test 验证打包](#五用-flowgame-test-验证打包)
- [六、仓库结构与改哪里](#六仓库结构与改哪里)
- [七、常用脚本](#七常用脚本)
- [八、常见问题](#八常见问题)
- [许可与第三方依赖](#许可与第三方依赖)

---

## 你能用它做什么

- 在浏览器中 **拖拽编排** LLM、条件分支、知识库、HTTP、记忆读写、HTML 模板等节点
- **保存 / 加载** 流程到 Redis（需后端）
- **试运行** 工作流（同步或流式进度，需 flowgame_python）
- **知识库** 管理（Qdrant + Embedding，需后端与向量服务）
- 将编辑器 **嵌入自有产品**：安装 `@flowgame/vue` + `@flowgame/core`，一行 `<FlowEditor />`

---

## 环境要求

| 工具 | 版本 |
|------|------|
| Node.js | **18+** |
| pnpm | **8+**（推荐 `corepack enable` 后使用） |
| Python（仅后端） | **3.10+** |
| Redis / Qdrant（可选） | 保存流程、知识库时需要 |

---

## 相关仓库

本项目（前端）与后端、测试项目 **分三个目录**，克隆时请分别获取：

| 仓库 | 说明 | 典型路径示例 |
|------|------|----------------|
| **flowgame**（本仓库） | Monorepo：core、vue、官方 Demo、打包脚本 | `.../flowgame` |
| **flowgame_python** | FastAPI：执行工作流、Redis、Qdrant API | `.../flowgame_python` |
| **flowgame-test** | 独立 Vue 项目，安装 `.tgz` 验证发布物 | `.../前端测试打包效果/flowgame-test` |

**端口约定（默认）**

| 服务 | 地址 |
|------|------|
| 官方编辑器 | http://127.0.0.1:8009 |
| 最小示例 playground | http://127.0.0.1:8010 |
| Python API | http://127.0.0.1:8008 |
| API 文档 | http://127.0.0.1:8008/docs |

前端通过 Vite 将 `/api` 代理到 `8008`，与 `configureFlowGameClient({ baseURL: '/api' })` 配合使用。

---

## 一、快速开始（在本仓库开发）

适合：贡献代码、改节点、改编辑器 UI。

### 1. 克隆并安装依赖

```bash
git clone <你的-flowgame-仓库地址> flowgame
cd flowgame
pnpm install
```

### 2. 启动前端（无需先 build）

```bash
pnpm dev
```

浏览器打开 **http://127.0.0.1:8009**。

此时可编辑画布；若未启动后端，**保存、试运行、流程列表、知识库** 等接口会失败，属正常现象。

### 3.（可选）最小接入示例

```bash
pnpm dev:playground
```

打开 **http://127.0.0.1:8010**，代码更少，适合对照如何引用 `@flowgame/vue`。

---

## 二、启动后端（完整功能）

适合：保存流程、试运行、知识库、记忆节点联调。

### 1. 进入 Python 仓库

```bash
cd /path/to/flowgame_python
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### 2. 编辑 `.env`（至少确认端口）

```env
FLOWGAME_PORT=8008
REDIS_HOST=127.0.0.1
QDRANT_HOST=127.0.0.1
# DEEPSEEK_API_KEY=...   # LLM 节点需要
```

### 3. 启动依赖（按需）

- **Redis**：流程列表与保存（默认 `6379`）
- **Qdrant**：知识库（默认 `6333`）
- **Embedding**：`.env` 中配置 `EMBEDDING_API_URL`，或放置本地模型 `model/BAAI/bge-small-zh-v1.5`（见 flowgame_python 的 README）

### 4. 启动 API

```bash
python run.py
```

验证：访问 http://127.0.0.1:8008/health ，或 http://127.0.0.1:8008/docs 。

### 5. 再启动前端

```bash
cd /path/to/flowgame
pnpm dev
```

在编辑器中即可使用保存、试运行、知识库等功能。

---

## 三、在别人 Vue 项目里使用（推荐路径）

适合：开源接入方、业务方只想要编辑器组件。

> **npm 正式发布后**（包名以 registry 为准）：

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

> **当前未上 npm 时**：请用下方 [四、本地 tgz](#四本地-tgz-模拟-npm-安装) 安装两个 `.tgz`，**必须同时安装 core 与 vue**。

### 1. 创建 Vue 3 + TypeScript 项目

```bash
pnpm create vite my-flow-app --template vue-ts
cd my-flow-app
pnpm install
pnpm add vue @arco-design/web-vue @tinyflow-ai/ui
# 若用 tgz，在此步骤改为 pnpm add /path/to/flowgame-core.tgz /path/to/flowgame-vue.tgz
```

### 2. 配置 `src/main.ts`

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
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
```

### 3. 配置 `src/App.vue`

```vue
<script setup lang="ts">
import { FlowEditor } from '@flowgame/vue'
</script>

<template>
  <FlowEditor class="flow-editor-host" />
</template>

<style>
html, body, #app { margin: 0; height: 100%; overflow: hidden; }
.flow-editor-host { display: block; width: 100%; height: 100%; }
</style>
```

### 4. 配置 `vite.config.ts`（连接后端）

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

### 5. 启动

```bash
pnpm dev
```

组件 API、事件、`builtin-business-modals` 等详见 [packages/vue/README.md](packages/vue/README.md)。

---

## 四、本地 tgz 模拟 npm 安装

适合：发布前自测、给同事发压缩包安装。

在 **flowgame 根目录**：

```bash
pnpm install
pnpm pack:packages
```

成功后生成（版本号以 `package.json` 为准）：

- `packages/core/flowgame-core-0.1.0.tgz`
- `packages/vue/flowgame-vue-0.1.0.tgz`

在目标 Vue 项目中 **一条命令安装两个包**：

```bash
pnpm add /绝对路径/flowgame/packages/core/flowgame-core-0.1.0.tgz \
         /绝对路径/flowgame/packages/vue/flowgame-vue-0.1.0.tgz
```

然后按 [第三节](#三在别人-vue-项目里使用推荐路径) 配置 `main.ts`、`App.vue`、`vite.config.ts`。

更细的排错表见 [本地安装测试.md](本地安装测试.md)。

---

## 五、用 flowgame-test 验证打包

维护者专用：目录 `前端测试打包效果/flowgame-test`，与 monorepo **无 workspace 关联**。

```bash
# 1. 在 flowgame 打新包
cd /path/to/flowgame && pnpm pack:packages

# 2. 在测试项目重装
cd /path/to/flowgame-test
pnpm add /path/to/flowgame/packages/core/flowgame-core-0.1.0.tgz \
         /path/to/flowgame/packages/vue/flowgame-vue-0.1.0.tgz
rm -rf node_modules/.vite
pnpm dev
```

确认：画布样式正常、左侧节点齐全、流程列表/知识库弹窗可用（需后端）。

仅更新 core 时：

```bash
cd /path/to/flowgame && pnpm -C packages/core build && pnpm -C packages/core pack
cd /path/to/flowgame-test
pnpm add /path/to/flowgame/packages/core/flowgame-core-0.1.0.tgz
rm -rf node_modules/.vite && pnpm dev
```

---

## 六、仓库结构与改哪里

```
flowgame/
├── packages/
│   ├── core/          # @flowgame/core — 节点、画布 patch、HTTP API 客户端
│   └── vue/           # @flowgame/vue — FlowEditor、侧栏、弹窗
├── apps/
│   ├── editor/        # 官方 Demo（pnpm dev → 8009）
│   └── playground-vue/  # 最小示例（8010）
├── 开发日志.md         # 功能变更记录
├── 本地安装测试.md
├── 开源流程.md         # 拆分与发布规划
└── CHANGELOG.md        # 可发布包版本说明
```

| 你想改… | 目录 |
|---------|------|
| 自定义节点、画布逻辑、API | `packages/core/src` |
| 编辑器 UI、属性面板 | `packages/vue/src` |
| 官方 Demo 业务页（流程列表壳层等） | `apps/editor/src` |

开发时 Vite 直接引用 `packages/*/src`，**改完保存即热更新，无需 `pnpm build`**。只有打包 tgz 或发布前才需要 `pnpm build:packages`。

---

## 七、常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动官方编辑器（8009） |
| `pnpm dev:playground` | 最小示例（8010） |
| `pnpm build` | 构建 packages + editor |
| `pnpm build:packages` | 仅构建 core + vue |
| `pnpm pack:packages` | 构建并生成 `.tgz` |
| `pnpm typecheck` | 全仓库类型检查 |

---

## 八、常见问题

| 现象 | 处理 |
|------|------|
| 找不到 `@flowgame/core` | 同时安装 **core** 与 **vue** 两个 tgz |
| 画布无样式 / 节点图标巨大 | 确认引入 `@tinyflow-ai/ui/dist/index.css` 与 `@flowgame/vue/style.css`；重新 `pnpm pack:packages` |
| 新节点不显示 | 删除测试项目 `node_modules/.vite` 后重启 `pnpm dev` |
| `form-data` 无 default export | 勿随意 `optimizeDeps.exclude` @flowgame 包；清 `.vite` 缓存 |
| 试运行 / 保存失败 | 启动 flowgame_python，端口与 Vite 代理一致（8008） |
| Arco 组件报错 | `app.use(ArcoVue)` 且引入 `arco.css` |
| 流程列表只弹 Message | 使用较新的 `@flowgame/vue` tgz（内置弹窗需后端 `/api`） |

---

## 许可与第三方依赖

- 本 Monorepo 可发布包：**MIT**（见各包 `LICENSE`）
- `@tinyflow-ai/ui` — **LGPL-3.0-or-later**（画布引擎，须单独引入 CSS）
- `@arco-design/web-vue` — MIT

分发产品前请确认 Tinyflow 许可证与您的商用场景兼容。

---

## 开发记录

功能与时间线见 [开发日志.md](开发日志.md)。  
在 Cursor 中开发时，可附加 Skill **flowgame-project**，Agent 会在改功能时同步更新 README 与本日志。
