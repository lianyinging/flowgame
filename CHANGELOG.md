# Changelog

All notable changes to the publishable packages (`@flowgame/core`, `@flowgame/vue`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.2]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.2
[0.1.1]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.1
[0.1.0]: https://github.com/lianyinging/flowgame/releases/tag/v0.1.0
