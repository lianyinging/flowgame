# @flowgame/core

FlowGame 工作流编辑器核心库（框架无关）：REST / 流式 API、自定义节点定义、画布 DOM 补丁、工作流归一化规则。

## 安装

```bash
pnpm add @flowgame/core @tinyflow-ai/ui
```

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
- `normalizeStartApiWorkflow` — Api 开始节点规则
- `createFlowGameEditor` 相关工具见主仓库文档

## 后端

完整试运行、Redis 存取、知识库接口需要 **flowgame_python** 或兼容的 HTTP API。仅编排 UI 时可只使用节点与本地 JSON。

## 许可

Apache-2.0（本包）。画布依赖 `@tinyflow-ai/ui`（LGPL-3.0-or-later），请一并遵守其许可。
