<p align="center">
  <a href="https://flowgame.mgdeep.com" target="_blank">
    <img
      src="https://image.cscmgg.com/wechatMiniprogramImages/adminImage/bannerImage/20260601/blstxodlnxg66p.png"
      alt="FlowGame"
      width="300"
    />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@flowgame/vue"><img src="https://img.shields.io/npm/v/@flowgame/vue?label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@flowgame/vue"><img src="https://img.shields.io/npm/dm/@flowgame/vue?label=downloads" alt="downloads" /></a>
  <a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="license" /></a>
</p>

<p align="center">
  <a href="https://github.com/lianyinging/flowgame/blob/master/README.en-US.md">English</a>
  ·
  <a href="https://github.com/lianyinging/flowgame">GitHub</a>
  ·
  <a href="https://flowgame.mgdeep.com">官网</a>
</p>

FlowGame 在 [Tinyflow](https://github.com/tinyflow-ai/tinyflow) 画布之上，面向 **AI 工作流** 提供 Vue 3 可视化编排组件。在 Tinyflow 拖拽体验基础上，扩展 Start API、模型调用、知识库+、记忆读写、HTML 模板等节点；配合 [flowgame_python](https://github.com/lianyinging/flowgame_python) 后端完成试运行、Redis 持久化与 Qdrant 检索。

## 特性

- 🎨 **开箱即用**

  `<FlowEditor />` 一行接入，内置流程列表、知识库配置、节点详情面板与试运行入口。

- 🧩 **高可定制**

  基于 `@flowgame/core` 注册自定义节点与画布补丁；通过 Props / 事件 / Expose 扩展业务 UI。

- 🔌 **前后端分离**

  前端负责编排与展示；执行、保存、向量检索由 Python 后端（FastAPI + Redis + Qdrant）提供。

- 📦 **npm 友好**

  与 `@flowgame/core`、`@tinyflow-ai/ui`、`@arco-design/web-vue` 配合，适用于 Vite / Vue 3 项目。

---

## 安装

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

## 快速开始

**`main.ts`**

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
  // canvasWatermark: 'YourBrand.ai', // 可选：画布品牌水印
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
```

**`App.vue`**

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

**`vite.config.ts`**（开发环境代理后端，默认 `8008`）

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8008', changeOrigin: true }
    }
  }
})
```

## FlowEditor API

| 类型 | 名称 | 说明 |
|------|------|------|
| Prop | `readonly` | 只读查看 |
| Prop | `flow-name` / `redis-key` | 从 Redis 加载流程 |
| Prop | `builtin-business-modals` | 内置流程列表/知识库弹窗（默认 `true`） |
| Prop | `canvas-watermark` | 画布品牌水印；不传则用全局 `canvasWatermark` 或默认 `FlowGame.ai` |
| Event | `saved` | 保存成功 |
| Event | `executed` | 试运行结束 |
| Expose | `getWorkflow()` | 当前工作流 JSON |

完整文档见 [GitHub README](https://github.com/lianyinging/flowgame/blob/master/README.md)。

## 许可

[Apache License 2.0](https://github.com/lianyinging/flowgame/blob/master/LICENSE)
