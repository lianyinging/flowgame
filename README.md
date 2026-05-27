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
│   ├── core/          # @flowgame/core — 可发布 npm 包
│   └── vue/           # @flowgame/vue — 可发布 npm 包
├── apps/
│   ├── editor/        # 官方完整 Demo
│   └── playground-vue/ # 最小接入示例
├── LICENSE
└── CHANGELOG.md
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动官方编辑器（8009） |
| `pnpm dev:playground` | 最小示例（8010） |
| `pnpm build` | 构建 packages + editor |
| `pnpm build:packages` | 仅构建可发布的 core + vue |
| `pnpm pack:packages` | 构建并生成 `.tgz`（本地模拟 npm 安装） |
| `pnpm typecheck` | 类型检查 |

## 日常开发改哪里

| 内容 | 目录 |
|------|------|
| 画布逻辑、API、自定义节点 | `packages/core/src` |
| 编辑器 UI | `packages/vue/src` |
| 流程列表、知识库管理 | `apps/editor/src` |

开发时 Vite 直接引用 `packages/*/src` 源码，**无需先 build**。

## 本地模拟别人 `pnpm add`（阶段 A）

在 monorepo 根目录执行：

```bash
pnpm pack:packages
```

会生成（版本号以实际为准）：

- `packages/core/flowgame-core-0.1.0.tgz`
- `packages/vue/flowgame-vue-0.1.0.tgz`

在新 Vue 3 项目中安装：

```bash
pnpm create vite my-flow-app --template vue-ts
cd my-flow-app
pnpm add @arco-design/web-vue @tinyflow-ai/ui vue

pnpm add /绝对路径/flowgame/packages/core/flowgame-core-0.1.0.tgz
pnpm add /绝对路径/flowgame/packages/vue/flowgame-vue-0.1.0.tgz
```

然后按 [packages/vue/README.md](packages/vue/README.md) 配置 `main.ts` 与 `App.vue`。

> `vue` 的 tgz 已声明对 `core` 的依赖；若安装器未自动链接 core，需同时安装 core 的 tgz。

## 在别人项目中使用（npm 发布后）

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue
```

详见 [packages/vue/README.md](packages/vue/README.md)。

## 后端联调

1. 启动 flowgame_python（默认 `8008`）
2. `configureFlowGameClient({ baseURL: '/api' })` + Vite 代理 `/api`

## 第三方许可

- `@tinyflow-ai/ui` — LGPL-3.0-or-later
- `@arco-design/web-vue` — MIT

发布前请确认 Tinyflow 许可与你的产品分发方式兼容。
