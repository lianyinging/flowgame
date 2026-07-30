# Changelog

All notable changes to the publishable packages (`@flowgame/core`, `@flowgame/vue`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.18] - 2026-07-23

### Changed

- `@flowgame/core` / `@flowgame/vue`: AgentTeam / Agent 配置改为 Redis（`/teams`、`/agents`），不再使用 localStorage
- `@flowgame/vue`: `@flowgame/core` peerDependency 提升为 `^0.1.18`

## [0.1.17] - 2026-07-23

### Added

- `@flowgame/core` / `@flowgame/vue`: 对话模板 **图生图（蓝色-展示）** / **图生图（紫色-展示）**（`image_chat_blue` / `image_chat_purple`）
- `@flowgame/core` / `@flowgame/vue`: 流程列表删除支持后端密码校验（`deleteFlowApi` + `/flows/delete`；按需弹密码框）
- `@flowgame/core` / `@flowgame/vue`: AgentTeam 主控看板字段 `statusCardKeys`；行业情报等 Team 模板增强

### Changed

- `@flowgame/vue`: `@flowgame/core` peerDependency 提升为 `^0.1.17`

## [0.1.16] - 2026-07-21

### Added

- `@flowgame/core` / `@flowgame/vue`: **Api接口结束**（`node_end_api`）：自定义对外输出；可关闭 `/execute` 过程详情；画布输出参数可引用上游
- `@flowgame/core` / `@flowgame/vue`: **网页搜索**（`webSearchNode`）、**网页抓取**（`fetchUrlNode`）、**图像生成**（`imageGenNode`，含 DashScope 图生图）
- `@flowgame/core` / `@flowgame/vue`: 对话开始支持 `image_chat` 模板；校验识别 Api接口结束上的 `assistantMessage`

### Fixed

- `@flowgame/core`: 对话流程校验不再只认内置结束节点，Api接口结束配置 `assistantMessage` 后可正常保存

## [0.1.15] - 2026-07-17

### Added

- `@flowgame/core` / `@flowgame/vue`: 画布品牌水印可配置：`configureFlowGameClient({ canvasWatermark })`、`<FlowEditor canvas-watermark="..." />`；默认仍为 `FlowGame.ai`

## [0.1.14] - 2026-07-13

### Added

- `@flowgame/core`: 文档上传 API 支持 `useHacr` 可选参数；`QdrantKbDocumentItem` 增加 `chunkingVersion` / `parentCount`
- `@flowgame/vue`: 知识库文档上传支持勾选「HACR 智能分片」；Firefox 拖入上传与上传成功提示优化

### Changed

- `@flowgame/core`: `configureFlowGameClient` 支持 `qdrantKbPrefix`（与后端 `FLOWGAME_QDRANT_KB_PREFIX` 对齐）

## [0.1.13] - 2026-05-27

### Fixed

- `@flowgame/core`: 状态机节点画布/侧栏输入框聚焦后只能输入一个字符的问题（避免输入时 DOM 重排失焦；侧栏参数行使用稳定 key）

## [0.1.12] - 2026-05-27

### Added

- `@flowgame/core` / `@flowgame/vue`: **状态机**节点（`stateMachineNode`）：Redis 实体状态 write/read/update/delete；Key 模板、命名空间、TTL、画布模式切换
- `@flowgame/core`: 状态机画布/侧栏按模式显示配置项；自定义入参与内置默认入参分区展示
- `@flowgame/vue`: 工具栏展示流程模式（新增/编辑/查看）、流程名称；保存/添加节点查看模式下置灰不隐藏

### Fixed

- `@flowgame/core`: 状态机 Key 模板渲染结果保留冒号；Redis Key 不再包含 methodKey
- `@flowgame/vue`: 流程列表在查看模式下仍显示「编辑」入口

## [0.1.11] - 2026-06-29

### Added

- `@flowgame/core` / `@flowgame/vue`: **条件选择器**（`ifNode`）多分支：单出口连多条下游，侧栏与画布为每条分支选择出边；条件参数支持 `{{参数名}}` 模板
- `@flowgame/core` / `@flowgame/vue`: **分支选择器**（`switchNode`）画布匹配行支持下游下拉、删除 case、添加 case；`switchKey` / case 匹配值支持 `{{}}`
- `@flowgame/core`: 节点 `branchEdgeMap` 与 `mergeIfNodeBranchEdgeMap`，画布读回时保留分支出边绑定

### Fixed

- `@flowgame/core` / `@flowgame/vue`: 下游下拉选「无」时侧栏/画布双向同步；选择后不再被 `onDataChange` 清空
- `@flowgame/core`: 条件选择器画布「否则如果」行支持删除

### Changed

- `@flowgame/core`: 动态代码节点默认引擎 `js` 与示例脚本

## [0.1.10] - 2026-06-18

### Changed

- `@flowgame/core`: 数据库节点 SQL 模板支持英文分号 `;` 顺序执行多条语句（`${sqlStr}` 传入整段 SQL 亦可）；输出仍为最后一条的 `data` / `rowCount`
- `flowgame_python`: `DatabaseNode` 实现多语句拆分执行；`#{}` 按语句自动分配预编译参数

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
