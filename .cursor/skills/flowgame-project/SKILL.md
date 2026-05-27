---
name: flowgame-project
description: Maintains FlowGame workflow editor monorepo, Python executor backend, and packaging test project. Updates 开发日志.md and README.md when features change. Use when developing flowgame, flowgame_python, flowgame-test, publishing packages, or when the user mentions工作流编排、打包、tgz、开源接入.
---

# FlowGame 项目 Skill

## 三仓库关系

| 仓库 | 路径 | 职责 |
|------|------|------|
| **前端 Monorepo** | `/Users/lianying/Desktop/ai工作流/flowgame` | Vue 3 工作流编辑器、`@flowgame/core` / `@flowgame/vue` 打包发布、官方 Demo |
| **Python 后端** | `/Users/lianying/Desktop/ai工作流/flowgame_python` | 工作流解析与执行、Redis 流程存储、Qdrant 知识库 API |
| **打包测试项目** | `/Users/lianying/Desktop/ai工作流/前端测试打包效果/flowgame-test` | 用 `pnpm add *.tgz` 验证发布物，与 monorepo 开发解耦 |

默认端口：**前端 8009**（editor）/ **8010**（playground）→ 代理 `/api` → **后端 8008**（`FLOWGAME_PORT`）。

## 前端 Monorepo 结构

```
flowgame/
├── packages/core/     # @flowgame/core — 画布、节点、API、patch
├── packages/vue/      # @flowgame/vue — FlowEditor 等 Vue 组件
├── apps/editor/       # 官方完整 Demo（pnpm dev）
├── apps/playground-vue/
├── README.md          # 对外保姆级使用说明（须保持更新）
├── 开发日志.md         # 开发记录（每次有意义变更须追加）
├── 本地安装测试.md     # tgz 本地安装细则
└── CHANGELOG.md       # 可发布包版本变更（发版时更新）
```

日常开发改 `packages/*` 即可，`pnpm dev` 直接引用源码，**无需先 build**。

## 文档维护义务（必做）

完成以下任一类型工作后，**在同一任务内**更新文档，不要留给用户提醒：

| 变更类型 | 更新 |
|----------|------|
| 新功能、新节点、新 API、行为变更 | `开发日志.md` 追加条目（日期 + 简述 + 涉及路径） |
| 安装方式、命令、端口、依赖、接入步骤变化 | `README.md` 对应章节 |
| 发布 `@flowgame/core` / `@flowgame/vue` 版本 | `CHANGELOG.md` + `开发日志.md` |
| 仅内部重构、无对外行为变化 | 可不写开发日志，除非用户要求 |

### 开发日志格式

```markdown
## YYYY-MM-DD — 简短标题

- **做了什么**：…
- **涉及**：`packages/core/...`、`packages/vue/...`
- **验证**：`pnpm dev` / `flowgame-test` 中 …
```

新条目写在文件顶部（最新在上）。

### README 原则

- 面向**第一次克隆仓库的开发者**与**只想接入编辑器的第三方**
- 步骤可复制粘贴；路径用 `/path/to/flowgame` 占位，不写死本机用户名
- 常见问题并入 README 或链到 `本地安装测试.md`

## 常用命令

```bash
# 前端 monorepo
cd /path/to/flowgame && pnpm install && pnpm dev

# 打 tgz（开源前本地验证）
pnpm pack:packages

# 测试项目重装包
cd /path/to/flowgame-test
pnpm add /path/to/flowgame/packages/core/flowgame-core-0.1.0.tgz \
         /path/to/flowgame/packages/vue/flowgame-vue-0.1.0.tgz
rm -rf node_modules/.vite && pnpm dev

# Python 后端
cd /path/to/flowgame_python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
python run.py   # 默认 FLOWGAME_PORT=8008
```

## 打包验证清单

1. `pnpm pack:packages` 成功生成两个 `.tgz`
2. 在 `flowgame-test` 一次安装 **core + vue** 两个 tgz
3. 引入 `@tinyflow-ai/ui/dist/index.css` 与 `@flowgame/vue/style.css`
4. `configureFlowGameClient({ baseURL: '/api' })` + Vite 代理到 8008
5. 后端 + Redis（保存/列表）+ Qdrant（知识库）按需启动

## 更多参考

- 本地 tgz 细节与排错：[本地安装测试.md](../../../本地安装测试.md)
- 开源拆分规划：[开源流程.md](../../../开源流程.md)
- Vue 组件 API：[packages/vue/README.md](../../../packages/vue/README.md)
- Python API：[flowgame_python/README.md](../../../../flowgame_python/README.md)（相对 monorepo 外同级目录）
