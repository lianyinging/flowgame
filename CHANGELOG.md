# Changelog

All notable changes to the publishable packages (`@flowgame/core`, `@flowgame/vue`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2026-06-15

### Added

- `@flowgame/core`: **对象存储**节点（`ossNode`）：`content` + `fileType`（image/html/txt/json 等）上传阿里云 OSS；支持自定义多个输入参数与 Object Key 模板
- `flowgame_python`: `OssNode` 执行器与 `OSS_*` 环境变量（需 `pip install oss2`）

### Fixed

- `flowgame_python`: 入参「引用」未选上游但「固定值」已填 HTML/文本时，不再误报 Missing required parameter（如 ossNode content）

## [0.1.8] - 2026-06-15

### Fixed

- `@flowgame/core`: 修复左侧节点分类 `MutationObserver` 在每次 DOM 变动时重复搬移节点，Safari 下易导致页面卡死
- `@flowgame/core`: HTML 模板预览 iframe 的 blob 回退仅执行一次，避免 `onload` 死循环
- `@flowgame/vue`: 画布 DOM 补丁合并为 `requestAnimationFrame` 调度，降低 Observer 反馈环风险

## [0.1.7] - 2026-06-15

### Added

- `@flowgame/core`: **并行分叉**（`forkNode`）、**汇聚（全部）**（`joinAllNode`）、**汇聚（任一）**（`joinAnyNode`）；试运行前校验分叉/汇聚拓扑
- `@flowgame/core`: **记忆写入** / **记忆读取**（`memoryWriteNode` / `memoryReadNode`）、**HTML 模板**（`htmlTemplateNode`）节点与画布预览
- `@flowgame/core`: 左侧「基础节点」分类折叠（`node-category-registry` + patch）
- `@flowgame/vue`: 记忆/HTML 模板侧栏块、知识库/流程列表浮层（`FlowKnowledgePanelModal`、`FlowListPanelModal`）、ProComponent 表格/表单/抽屉

### Changed

- `@flowgame/core`: 模型调用节点默认接口 `https://api.deepseek.com/chat/completions`、默认模型 `deepseek-v4-flash`

## [0.1.6] - 2026-05-27

### Fixed

- `@flowgame/core`: 每次 API 请求自动携带 `X-Flowgame-Qdrant-Kb-Prefix` / `X-Flowgame-Redis-Key-Prefix`，与 `configureFlowGameClient` 配置一致（需配合 `flowgame_python` 前缀中间件）
- `@flowgame/vue`: 知识库 Q&A `scroll` / 删点等接口统一用当前 `qdrantKbPrefix` 拼物理 Collection 名，不再沿用接口返回的旧 `flowgame_*` 名称；切换前缀时清空 kb-bases 缓存

## [0.1.5] - 2026-05-27

### Added

- `@flowgame/core`: `configureFlowGameClient` 支持可选 `redisKeyPrefix`、`qdrantKbPrefix`，多项目共用 Redis / Qdrant 时隔离命名空间（须与 `flowgame_python` `.env` 一致）

### Removed

- `@flowgame/core`: 移除 `wx_base:ai:flow_list:` 旧 Redis 前缀兼容逻辑

### Changed

- `@flowgame/vue`: 保存流程弹窗 Redis Key 占位符随当前前缀动态展示

## [0.1.4] - 2026-05-27

### Added

- `@flowgame/core`: 新增 **数据库** 自定义节点（`databaseNode`），位于「基础节点」；支持 MyBatis 风格 SQL 模板（`#{}` / `${}`、`<if>` / `<where>` 等），默认 MySQL；输出 `data`、`rowCount`、`success`、`errorMessage`

## [0.1.3] - 2026-06-02

### Fixed

- `@flowgame/vue`: 修复接入示例中 `flow-editor-host` 与 `FlowEditor` 同元素时 `display: block` 覆盖 flex，导致画布高度塌陷的问题
- `@flowgame/vue`: 推荐用法改为外层 `<div class="flow-editor-host"><FlowEditor /></div>`，样式已内置进 `style.css`

### Changed

- `@flowgame/core`、`@flowgame/vue`: 版本号同步为 **0.1.3**（core 无功能变更，便于成对安装）

## [0.1.2] - 2026-06-01

### Changed

- `@flowgame/core`、`@flowgame/vue`: 许可证由 MIT 调整为 **Apache-2.0**
- npm 包 README 对齐 LogicFlow 风格（Logo、徽章、特性说明）
- `repository` / `homepage` 更新为 GitHub 与官网

## [0.1.1] - 2026-05-29

### Fixed

- `@flowgame/vue`: 右侧节点详情面板与左侧「添加节点」菜单一致的浮层定位（`top/right: 10px`）与高度同步
- `@flowgame/vue`: 详情面板内部滚动时顶部节点标题固定不随动
- `@flowgame/vue`: 移除编辑器顶部流程标题栏，画布区域布局优化

## [0.1.0] - 2026-05-24

### Added

- `@flowgame/core`: workflow API client, custom nodes, canvas patches, workflow utilities
- `@flowgame/vue`: `FlowEditor` component with Arco Design UI
- Monorepo dev apps: `flowgame-editor`, `playground-vue`

[0.1.9]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.9
[0.1.8]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.8
[0.1.7]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.7
[0.1.6]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.6
[0.1.5]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.5
[0.1.4]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.4
[0.1.3]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.3
[0.1.2]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.2
[0.1.1]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.1
[0.1.0]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.0
