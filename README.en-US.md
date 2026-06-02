<p align="center">
  <a href="https://flowgame.mgdeep.com" target="_blank">
    <img
      src="https://image.cscmgg.com/wechatMiniprogramImages/adminImage/bannerImage/20260601/blstxodlnxg66p.png"
      alt="FlowGame logo"
      width="300"
    />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@flowgame/vue"><img src="https://img.shields.io/npm/v/@flowgame/vue?label=npm" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue" alt="license" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen" alt="node" />
</p>

[简体中文](./README.md) | English

- **FlowGame** extends the [Tinyflow](https://github.com/tinyflow-ai/tinyflow) canvas engine for **AI workflows**: it keeps Tinyflow’s drag-and-drop editing, adds **custom nodes**, and ships with a **Python backend** for real execution and persistence.

- Embed the editor in any Vue 3 app via `@flowgame/vue`’s `FlowEditor`. **Trial runs, Redis flow storage, and vector search** are handled by **[flowgame_python](https://github.com/lianyinging/flowgame_python)** (FastAPI + Redis + Qdrant) — frontend and backend are separate and deployable via Docker.

**Custom nodes added on top of Tinyflow** (registered in `@flowgame/core`):

| Node | Description |
|------|-------------|
| **Start API** | HTTP entry point — external API path and input params |
| **LLM API** | Configure API key, endpoint, and model for LLM calls |
| **Knowledge Base+** | Qdrant-backed retrieval for RAG |
| **Memory Write / Read** | Cross-node, cross-turn session context |
| **HTML Template** | Render structured HTML from templates |

## Core Capabilities

- **Built on Tinyflow**: Reuses the canvas engine and adds Start API, LLM API, Knowledge Base+, memory read/write, and HTML template nodes.
- **Python backend execution**: flowgame_python parses workflows, calls LLM/HTTP, reads/writes Redis and Qdrant, with sync and streaming trial runs.
- **Ready-to-use component**: Drop in `<FlowEditor />` with built-in flow list, knowledge base panel, node inspector, and trial run.
- **Clear layering**: `@flowgame/core` for nodes and API client; `@flowgame/vue` for Vue 3 UI customization.
- **Flexible deployment**: npm integration, local monorepo dev, or Docker one-shot (web + API + Redis + Qdrant).

---

## Quick Start (npm install)

### Requirements

| Tool | Version |
|------|---------|
| Node.js | **18+** |
| pnpm / npm / yarn | Any (pnpm recommended) |
| Python backend (full features) | **3.10+**, see [flowgame_python](https://github.com/lianyinging/flowgame_python) |

### 1. Create a Vue 3 project

```bash
pnpm create vite my-flow-app --template vue-ts
cd my-flow-app
pnpm install
```

### 2. Install FlowGame and peer dependencies

```bash
pnpm add @flowgame/vue @flowgame/core @tinyflow-ai/ui @arco-design/web-vue vue
```

Current npm version: **0.1.2** (check with `npm view @flowgame/vue version`).

### 3. Configure entry and styles

**`src/main.ts`**

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
  onError: (msg) => alert(msg)
})

createApp(App).use(ArcoVue).mount('#app')
```

**`src/App.vue`**

```vue
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

**`vite.config.ts`** (dev proxy to backend)

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true
      }
    }
  }
})
```

### 4. Start the backend (optional, required for full features)

```bash
# In the flowgame_python repo
python run.py   # default http://127.0.0.1:8008
```

### 5. Start the frontend

```bash
pnpm dev
```

Open the dev URL in your browser. Without the backend, the canvas works; **save, trial run, flow list, and knowledge base** APIs will fail — this is expected.

---

## Use in a Vue Project

### Minimal integration

After installing dependencies and configuring `main.ts`, `App.vue`, and `vite.config.ts` as above, mount `<FlowEditor />` in your page.

### FlowEditor API (common)

| Type | Name | Description |
|------|------|-------------|
| Prop | `readonly` | Read-only view mode |
| Prop | `flow-name` / `redis-key` | Load a flow from Redis |
| Prop | `builtin-business-modals` | Built-in flow list / knowledge modals (default `true`) |
| Event | `saved` | Save succeeded, `{ flowName }` |
| Event | `executed` | Trial run finished, `{ phase: 'success' \| 'error' }` |
| Event | `open-flow-list` / `open-flow-knowledge` | Custom modals when `builtin-business-modals=false` |
| Expose | `getWorkflow()` | Current workflow JSON |
| Expose | `openFlowFromListPanel(payload)` | Open or create a flow from the list |

Full API details: [packages/vue/README.md](packages/vue/README.md).

### Custom backend URL

In production, proxy `/api` via Nginx to the Python service and keep `baseURL: '/api'`. For cross-origin APIs, set a full `baseURL` in `configureFlowGameClient` and configure CORS.

### Develop in this monorepo (contributors)

```bash
git clone https://github.com/lianyinging/flowgame.git
cd flowgame
pnpm install
pnpm dev              # Official editor → http://127.0.0.1:8009
pnpm dev:playground   # Minimal example → http://127.0.0.1:8010
```

Vite references `packages/*/src` directly — hot reload works without building first.

---

## Project Structure

```
flowgame/
├── packages/
│   ├── core/              # @flowgame/core — nodes, canvas patches, API client
│   └── vue/               # @flowgame/vue — FlowEditor, side panels, modals
├── apps/
│   ├── editor/            # Official demo (pnpm dev → 8009)
│   └── playground-vue/    # Minimal integration example (8010)
├── deploy/                # Docker / Nginx configs
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── nginx.conf
├── README.md              # Chinese docs
├── README.en-US.md        # This file
├── Docker部署.md          # Detailed Docker guide (Chinese)
└── CHANGELOG.md           # Published package changelog
```

| You want to change… | Directory |
|---------------------|-----------|
| Custom nodes, canvas logic, API | `packages/core/src` |
| Editor UI, inspector panel | `packages/vue/src` |
| Official demo pages | `apps/editor/src` |

**Related repositories**

| Repo | Description |
|------|-------------|
| [flowgame](https://github.com/lianyinging/flowgame) | This repo (frontend monorepo) |
| [flowgame_python](https://github.com/lianyinging/flowgame_python) | Python executor, Redis, Qdrant API |

**Default ports**

| Service | URL |
|---------|-----|
| Official editor | http://127.0.0.1:8009 |
| Playground | http://127.0.0.1:8010 |
| Python API | http://127.0.0.1:8008 |
| API docs | http://127.0.0.1:8008/docs |

---

## FAQ

| Issue | Fix |
|-------|-----|
| Cannot find `@flowgame/core` | Install both `@flowgame/core` and `@flowgame/vue` |
| Missing styles / huge node icons | Import `@tinyflow-ai/ui/dist/index.css` and `@flowgame/vue/style.css` |
| Updated npm package but behavior unchanged | Delete `node_modules/.vite` and restart `pnpm dev` |
| `form-data` has no default export | Do not `optimizeDeps.exclude` @flowgame packages; clear `.vite` cache |
| Trial run / save fails | Start flowgame_python; Vite proxy port must match backend (default 8008) |
| Arco component errors | Call `app.use(ArcoVue)` and import `arco.css` |
| Flow list only shows Message | Use a recent `@flowgame/vue` version and ensure `/api` backend is up |
| Docker port 8009 connection reset | Ensure `nginx.conf` listens on **8009** and mapping is `8009:8009` |

---

## Docker Deployment

Deploy the full stack — **web + API + Redis + Qdrant** — on a server with Docker.

### Directory layout

`flowgame` and `flowgame_python` must be **siblings** under the same parent:

```
/opt/flowgame/
├── flowgame/           # This repo
│   └── deploy/
└── flowgame_python/    # Python backend
```

### Quick deploy

```bash
mkdir -p /opt/flowgame && cd /opt/flowgame
git clone https://github.com/lianyinging/flowgame.git flowgame
git clone https://github.com/lianyinging/flowgame_python.git flowgame_python

cd flowgame/deploy
cp .env.example .env    # Edit ports as needed
docker compose up -d --build
```

### Verify

```bash
curl http://127.0.0.1:8008/health
curl -I http://127.0.0.1:8009
```

Open in browser: **http://\<server-ip\>:8009** (API docs: **http://\<server-ip\>:8009/docs**).

| Container | Default host port | Role |
|-----------|-------------------|------|
| `web` | 8009 | Nginx serves editor, proxies `/api` to backend |
| `api` | 8008 | FastAPI workflow execution |
| `redis` | 6379 | Flow storage |
| `qdrant` | 6333 | Vector knowledge base |

Full guide: **[Docker部署.md](Docker部署.md)**.

---

## License & Third-Party

FlowGame (`@flowgame/core`, `@flowgame/vue`) is licensed under **[Apache License 2.0](LICENSE)**.

Peer dependencies such as `@tinyflow-ai/ui` (LGPL-3.0-or-later) and `@arco-design/web-vue` use their own licenses — verify compatibility before distribution.
