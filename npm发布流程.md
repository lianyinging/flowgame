# FlowGame npm 发布流程

本文说明如何将 Monorepo 中的 **`@flowgame/core`** 与 **`@flowgame/vue`** 发布到 [npm](https://www.npmjs.com/)。

> 发布的是 **前端库包**，不包含 `apps/editor` 官方 Demo。接入方 `pnpm add` 后在自己的 Vue 3 项目中使用；完整功能仍需配合 [flowgame_python](https://github.com/YOUR_ORG/flowgame_python) 后端。

---

## 一、发布物说明

| 包名 | 目录 | 说明 |
|------|------|------|
| `@flowgame/core` | `packages/core` | 节点定义、API 客户端、画布补丁（框架无关） |
| `@flowgame/vue` | `packages/vue` | `FlowEditor` 等 Vue 3 组件 |

**依赖关系**：必须先发布 `@flowgame/core`，再发布 `@flowgame/vue`（vue 的 `peerDependencies` 依赖 core）。

**用户还需自行安装**（peer，不会自动打进包里）：

- `vue`
- `@tinyflow-ai/ui`
- `@arco-design/web-vue`（使用 `@flowgame/vue` 时）

---

## 二、发布前准备（一次性）

### 1. npm 账号与 scope

1. 注册 [npmjs.com](https://www.npmjs.com/signup) 账号
2. 在 npm 创建 Organization **`flowgame`**（scope 为 `@flowgame`），或将 scope 绑定到你的账号
3. 首次发布 scoped 包需加 `--access public`（`package.json` 里已配置 `publishConfig.access: public`）

### 2. 本地登录 npm

```bash
npm login
# 或国内镜像发布到官方源时：
npm login --registry=https://registry.npmjs.org
```

验证：

```bash
npm whoami
```

### 3. 修正 `repository` 占位符

发布前将两个包 `package.json` 中的仓库地址改为真实 Git 地址：

```json
"repository": {
  "type": "git",
  "url": "https://gitee.com/repeatedly_read/flowgame.git",
  "directory": "packages/core"
}
```

`packages/vue` 同理，`directory` 改为 `packages/vue`。

---

## 三、每次发版完整流程

以下以发布 **0.1.1** 为例（版本号按 [SemVer](https://semver.org/lang/zh-CN/) 自行决定）。

### 步骤 1：确认代码可发布

```bash
cd /path/to/flowgame
pnpm install
pnpm typecheck
pnpm build:packages
```

确保无 TypeScript 错误，且 `packages/core/dist`、`packages/vue/dist` 已生成。

### 步骤 2：更新版本号

**两个包的 `version` 必须一致**（当前策略：core 与 vue 同版本发布）。

```bash
# 方式 A：手动改 packages/core/package.json 与 packages/vue/package.json 的 "version"

# 方式 B：用 npm version（在各自包目录执行，会写 git tag，按需使用）
cd packages/core && npm version patch   # 0.1.0 → 0.1.1
cd ../vue && npm version patch
```

同步修改 `packages/vue/package.json` 中 peer 版本范围：

```json
"peerDependencies": {
  "@flowgame/core": "^0.1.1",
  ...
}
```

### 步骤 3：更新 CHANGELOG

编辑根目录 [CHANGELOG.md](CHANGELOG.md)，在顶部追加新版本条目，例如：

```markdown
## [0.1.1] - 2026-05-29

### Added
- …

### Fixed
- …

[0.1.1]: https://gitee.com/repeatedly_read/flowgame/releases/tag/v0.1.1
```

### 步骤 4：本地 tgz 验证（强烈建议）

```bash
pnpm pack:packages
```

在独立测试项目（如 `flowgame-test`）安装：

```bash
cd /path/to/flowgame-test
pnpm add /path/to/flowgame/packages/core/flowgame-core-0.1.1.tgz \
         /path/to/flowgame/packages/vue/flowgame-vue-0.1.1.tgz
rm -rf node_modules/.vite
pnpm dev
```

按 [本地安装测试.md](本地安装测试.md) 检查：

- [ ] 画布与节点样式正常
- [ ] 左侧节点列表完整
- [ ] 流程列表 / 知识库弹窗可用（需后端）
- [ ] 试运行 / 保存正常（需后端）

### 步骤 5：提交版本变更

```bash
cd /path/to/flowgame
git add packages/core/package.json packages/vue/package.json CHANGELOG.md
git commit -m "chore: release v0.1.1"
git tag v0.1.1
# git push && git push --tags   # 按你们团队规范推送
```

### 步骤 6：发布到 npm

**顺序：先 core，后 vue。**

```bash
cd /path/to/flowgame

# 发布 core
pnpm --filter @flowgame/core publish --access public --no-git-checks

# 发布 vue
pnpm --filter @flowgame/vue publish --access public --no-git-checks
```

说明：

- `prepublishOnly` 会在发布前自动执行 `pnpm run build`
- `--no-git-checks`：工作区有未提交文件时仍可发布（建议尽量在干净工作区操作）
- 若使用 `npm publish` 而非 pnpm，在包目录执行：`npm publish --access public`

### 步骤 7：发布后验证

```bash
# 查看 registry 上的版本
npm view @flowgame/core version
npm view @flowgame/vue version

# 在空目录试装
mkdir /tmp/flowgame-npm-smoke && cd /tmp/flowgame-npm-smoke
pnpm init
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

确认 `node_modules/@flowgame/core/dist` 与 `node_modules/@flowgame/vue/dist` 存在且体积合理。

### 步骤 8：更新文档与开发日志

- [README.md](README.md) 中「在别人 Vue 项目里使用」改为正式 npm 安装命令
- [开发日志.md](开发日志.md) 追加发版记录

---

## 四、版本号策略

| 变更类型 | 版本 bump | 示例 |
|----------|-----------|------|
| 修复 bug、文档、无破坏性调整 | **patch** | 0.1.0 → 0.1.1 |
| 新节点、新 API、向后兼容功能 | **minor** | 0.1.0 → 0.2.0 |
| 删除导出、节点 type 变更、不兼容 peer | **major** | 0.1.0 → 1.0.0 |

`@flowgame/vue` 的 `@flowgame/core` peer 范围建议与当前 minor 对齐，例如发 `0.2.x` 时写 `"@flowgame/core": "^0.2.0"`。

---

## 五、发布检查清单

复制发版前逐项勾选：

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm build:packages` 通过
- [ ] `packages/core`、`packages/vue` 的 `version` 一致
- [ ] `vue` 的 `peerDependencies["@flowgame/core"]` 已更新
- [ ] `CHANGELOG.md` 已写
- [ ] `repository.url` 已填写为 Gitee 地址（非占位符）
- [ ] `pnpm pack:packages` + 测试项目验证通过
- [ ] 已 `git commit` + `git tag vX.Y.Z`
- [ ] 先 publish `@flowgame/core`，再 publish `@flowgame/vue`
- [ ] `npm view` 与空项目 `pnpm add` 验证通过

---

## 六、常见问题

| 现象 | 处理 |
|------|------|
| `402 Payment Required` / scope 不存在 | 确认 npm 上已创建 **`flowgame`** 组织（`@flowgame`），或改用你有权限的 scope |
| `403 Forbidden` | `npm whoami` 确认登录账号有该 scope 发布权限 |
| `You cannot publish over the previously published versions` | 版本号未递增，改大 `version` 后重发 |
| 只发了 vue 没发 core | 用户安装会 peer 报错；先补发 core |
| 用户装完没样式 | 文档中强调必须引入 `@tinyflow-ai/ui/dist/index.css` 与 `@flowgame/vue/style.css` |
| 发布到了错误 registry | `npm config get registry` 应为 `https://registry.npmjs.org` |
| 包体积异常大 | 检查 `files` 是否只含 `dist`、`README.md`、`LICENSE`，未把 `src` 打进去 |

---

## 七、接入方安装方式（发布后）

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

最小接入代码见 [README.md — 在别人 Vue 项目里使用](README.md#三在别人-vue-项目里使用推荐路径) 或 [packages/vue/README.md](packages/vue/README.md)。

---

## 八、可选：CI 自动发布（后续）

当前仓库**未配置** Changesets / GitHub Actions 自动发布。若后续需要，建议：

1. 引入 [@changesets/cli](https://github.com/changesets/changesets)
2. PR 中 `pnpm changeset` 记录变更
3. 合并后 `changeset version` 升版
4. tag `v*` 触发 Actions：`pnpm build:packages` → `pnpm publish -r --access public`

规划见 [开源流程.md — 构建与发布](开源流程.md)。

---

## 相关文档

| 文档 | 用途 |
|------|------|
| [本地安装测试.md](本地安装测试.md) | 发布前 tgz 模拟安装 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更记录 |
| [开源流程.md](开源流程.md) | 长期开源与多包规划 |
| [packages/vue/README.md](packages/vue/README.md) | 组件 API |
