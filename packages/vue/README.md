# @flowgame/vue

FlowGame 工作流可视化编辑器 — Vue 3 组件。

## 安装

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

## 最小示例

```ts
// main.ts
import { createApp } from 'vue'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import '@tinyflow-ai/ui/dist/index.css'
import '@flowgame/vue/style.css'
import { configureFlowGameClient } from '@flowgame/core'
import { FlowEditor } from '@flowgame/vue'
import App from './App.vue'

configureFlowGameClient({
  baseURL: '/api',
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
```

```vue
<!-- App.vue -->
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

## 开发环境代理

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8008', changeOrigin: true }
    }
  }
})
```

## FlowEditor API

### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `readonly` | `boolean` | 只读查看 |
| `flow-name` | `string` | 流程名称（加载 Redis） |
| `redis-key` | `string` | Redis 键 |
| `title` | `string` | 覆盖顶部标题 |
| `builtin-business-modals` | `boolean` | 是否内置流程列表/知识库弹窗（默认 `true`） |

### 事件

| 事件 | 说明 |
|------|------|
| `open-flow-list` | 点击「流程列表」且 `builtin-business-modals=false` 时触发 |
| `open-flow-knowledge` | 点击「知识库配置」且 `builtin-business-modals=false` 时触发 |
| `saved` | 保存成功 `{ flowName }` |
| `executed` | 试运行结束 `{ phase: 'success' \| 'error' }` |

### Expose

| 方法 | 说明 |
|------|------|
| `openFlowFromListPanel(payload)` | 从列表打开/新建流程 |
| `reloadFromProps()` | 按 props 重新加载 |
| `getWorkflow()` | 当前工作流 JSON |

默认已内置流程列表、知识库配置弹窗（需配置 `configureFlowGameClient` 与后端 API）。若需自定义 UI，设置 `:builtin-business-modals="false"` 并监听 `open-flow-list` / `open-flow-knowledge`。

## 许可

MIT（本包）。依赖 `@tinyflow-ai/ui`（LGPL-3.0-or-later）、`@arco-design/web-vue`（MIT）。
