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
  <a href="https://www.npmjs.com/package/@flowgame/core"><img src="https://img.shields.io/npm/v/@flowgame/core?label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@flowgame/core"><img src="https://img.shields.io/npm/dm/@flowgame/core?label=downloads" alt="downloads" /></a>
  <a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="license" /></a>
</p>

<p align="center">
  <a href="https://github.com/lianyinging/flowgame/blob/master/README.en-US.md">English</a>
  ·
  <a href="https://github.com/lianyinging/flowgame">GitHub</a>
  ·
  <a href="https://flowgame.mgdeep.com">官网</a>
</p>

`@flowgame/core` 是 FlowGame 的**框架无关核心库**：在 [Tinyflow](https://github.com/tinyflow-ai/tinyflow) 之上注册 AI 工作流自定义节点，提供 HTTP API 客户端、画布 DOM 补丁与工作流归一化规则。Vue UI 见 [@flowgame/vue](https://www.npmjs.com/package/@flowgame/vue)。

## 特性

- 🧱 **节点与画布**

  注册 Start API、LLM API、知识库+、记忆读写、HTML 模板等节点；补丁 Tinyflow 画布交互。

- 🌐 **API 客户端**

  `configureFlowGameClient` 统一 `/api` 前缀；支持同步执行与 NDJSON 流式试运行。

- ⚙️ **可独立使用**

  仅编排时可只用节点定义与本地 JSON；完整保存/执行需 [flowgame_python](https://github.com/lianyinging/flowgame_python) 或兼容后端。

- 📦 **与 Vue 包分层**

  `@flowgame/core` 无 UI 依赖；`@flowgame/vue` 负责 `FlowEditor` 与业务弹窗。

---

## 安装

```bash
pnpm add @flowgame/core @tinyflow-ai/ui
```

配合 Vue 编辑器时一并安装 `@flowgame/vue`。

## 配置 API

```ts
import { configureFlowGameClient, configureFlowGameAuth } from '@flowgame/core'

configureFlowGameClient({
  baseURL: '/api',
  onError: (message) => console.error(message)
})

configureFlowGameAuth({
  getToken: () => localStorage.getItem('token') ?? undefined
})
```

## 常用导出

- `flowGameCustomNodes` — 注册到 Tinyflow 的自定义节点
- `executeFlowGameStreamApi` / `saveFlowWorkflowApi` — 后端接口
- `normalizeStartApiWorkflow` — Start API 节点规则

完整文档见 [GitHub README](https://github.com/lianyinging/flowgame/blob/master/README.md)。

## 许可

[Apache License 2.0](https://github.com/lianyinging/flowgame/blob/master/LICENSE)
