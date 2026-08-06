# FlowGame Docker 部署指南

本文说明如何在**已安装 Docker** 的服务器上，通过 **拉取代码 → 本地构建镜像 → 启动容器** 的方式部署完整 FlowGame 环境（前端编辑器 + Python API + Redis + Qdrant）。

---

## 一、架构说明

| 容器 | 镜像来源 | 默认宿主机端口 | 作用 |
|------|----------|----------------|------|
| `web` | 在服务器上 `docker build`（`flowgame` 仓库） | **8009**（映射 `8009:8009`） | Nginx 托管编辑器静态页，并将 `/api` 反向代理到后端 |
| `api` | 在服务器上 `docker build`（`flowgame_python` 仓库） | **8008** | FastAPI：工作流执行、Redis 流程存储、Qdrant 知识库 |
| `redis` | `redis:7-alpine` | **6379**（`REDIS_HOST_PORT`） | 流程保存与列表 |
| `qdrant` | `qdrant/qdrant` | **6333**（`QDRANT_HOST_PORT`） | 向量知识库 |

浏览器访问：**http://服务器IP:8009**

数据流：

```
浏览器 → web(Nginx:8009) → 静态资源
                      └→ /api/* → api:8008 → redis / qdrant / LLM
```

---

## 二、服务器前置条件

| 项目 | 要求 |
|------|------|
| Docker | 20.10+ |
| Docker Compose | v2（`docker compose` 子命令） |
| Git | 用于拉取代码 |
| 磁盘 | 建议 ≥ 10 GB（Python 依赖与向量模型可能较大） |
| 内存 | 建议 ≥ 4 GB；若容器内使用本地 Embedding 模型，建议 ≥ 8 GB |

验证：

```bash
docker --version
docker compose version
```

---

## 三、目录布局（重要）

FlowGame 前端与后端是**两个独立 Git 仓库**，`docker-compose.yml` 要求它们**并列放在同一父目录**下：

```
/opt/flowgame/                 # 父目录（名称可自定）
├── flowgame/                  # 本仓库（前端 Monorepo）
│   └── deploy/
│       ├── docker-compose.yml
│       ├── Dockerfile
│       ├── nginx.conf
│       └── .env               # 部署时从 .env.example 复制
└── flowgame_python/           # Python 后端仓库
    └── Dockerfile
```

`deploy/docker-compose.yml` 中：

- 前端构建上下文：`flowgame/` 根目录
- 后端构建上下文：`../flowgame_python`（相对 `flowgame/deploy` 即 `../../flowgame_python`）

---

## 四、首次部署（逐步操作）

### 1. 创建目录并克隆代码

```bash
sudo mkdir -p /opt/flowgame
cd /opt/flowgame

# 替换为你的实际仓库地址
git clone <flowgame-前端仓库地址> flowgame
git clone <flowgame_python-后端仓库地址> flowgame_python
```

### 2. 配置环境变量

```bash
cd /opt/flowgame/flowgame/deploy
cp .env.example .env
```

编辑 `.env`。**模型调用（`llmapiNode`）的 API Key、接口地址、模型名保存在流程 JSON 里**，一般不必在服务器 `.env` 配置 LLM。

仅当流程中仍使用旧版 **`llmNode`（大模型）** 节点时，才需要取消注释并填写：

```env
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

可选修改宿主机端口（默认前端 8009、API 8008、Redis 6379、Qdrant 6333）：

```env
FLOWGAME_WEB_PORT=8009
FLOWGAME_API_PORT=8008
REDIS_HOST_PORT=6379
QDRANT_HOST_PORT=6333
```

> `REDIS_PORT` / `QDRANT_PORT` 供容器内 `api` 连接 Redis/Qdrant 服务（固定 6379 / 6333），与宿主机映射端口无关。

### 3. 构建并启动（在服务器上打包镜像）

```bash
cd /opt/flowgame/flowgame/deploy
docker compose up -d --build
```

首次构建会：

1. **web**：Node 20 + pnpm 安装依赖 → `pnpm build` 生成静态资源 → 打入 Nginx 镜像
2. **api**：Python 3.10 安装 `requirements.txt` → 启动 uvicorn
3. 拉取 Redis、Qdrant 官方镜像并创建数据卷

查看进度：

```bash
docker compose logs -f
```

### 4. 验证

```bash
# 容器状态（api 应为 healthy）
docker compose ps

# 后端健康检查
curl http://127.0.0.1:8008/health

# 前端页面
curl -I http://127.0.0.1:8009
```

浏览器打开：`http://<服务器IP>:8009`

API 文档（经 Nginx 转发）：`http://<服务器IP>:8009/docs`

---

## 五、日常运维命令

均在 `flowgame/deploy` 目录执行。

| 操作 | 命令 |
|------|------|
| 启动 | `docker compose up -d` |
| 停止 | `docker compose down` |
| 停止并删除数据卷 | `docker compose down -v` |
| 查看日志 | `docker compose logs -f` |
| 只看 API 日志 | `docker compose logs -f api` |
| 重新构建并启动 | `docker compose up -d --build` |
| 仅重建前端 | `docker compose up -d --build web` |
| 仅重建后端 | `docker compose up -d --build api` |

---

## 六、更新代码后重新部署

```bash
cd /opt/flowgame

# 拉取最新代码
git -C flowgame pull
git -C flowgame_python pull

# 重新构建并滚动更新
cd flowgame/deploy
docker compose up -d --build
```

若只改了前端 UI / 节点：

```bash
docker compose up -d --build web
```

若只改了 Python 后端：

```bash
docker compose up -d --build api
```

---

## 七、单独构建镜像（不用 compose）

适合调试 Dockerfile 或推送到私有 Registry。

### 前端

```bash
cd /opt/flowgame/flowgame
docker build -f deploy/Dockerfile -t flowgame-web:latest .
```

### 后端

```bash
cd /opt/flowgame/flowgame_python
docker build -t flowgame-api:latest .
```

---

## 八、Embedding（知识库向量）说明

知识库检索需要 Embedding。后端优先级：

1. **`.env` 中配置 `EMBEDDING_API_URL`**（生产推荐）— 独立 HTTP 向量服务
2. **容器内本地模型** — 首次可能从 HuggingFace 下载 `BAAI/bge-small-zh-v1.5`，耗时长、占内存

生产环境建议在 `.env` 中配置：

```env
EMBEDDING_API_URL=http://your-embedding-host/embed
```

若必须使用本地模型，可将模型目录挂载进 `api` 容器（在 `docker-compose.yml` 的 `api` 下增加）：

```yaml
volumes:
  - /path/on/host/model:/app/model:ro
```

并在 `.env` 中设置：

```env
EMBEDDING_MODEL_PATH=/app/model/BAAI/bge-small-zh-v1.5
```

---

## 九、防火墙与反向代理

### 防火墙

若使用 `ufw`，放行前端端口：

```bash
sudo ufw allow 8009/tcp
# 若需直接访问 API 文档
sudo ufw allow 8008/tcp
```

### Nginx / HTTPS（可选）

生产环境建议在宿主机再用一层 Nginx/Caddy 做 HTTPS，将域名反代到 `127.0.0.1:8009`。容器内 Nginx 已处理 `/api` 转发，**无需在宿主机再拆前后端**。

---

## 十、工作流执行日志（可选）

后端支持在 **试运行 / execute** 时记录每个节点的开始、结束、耗时与输出摘要，由环境变量控制。

| 变量 | 说明 | 默认 |
|------|------|------|
| `FLOWGAME_EXECUTION_LOG_ENABLED` | 是否开启 | `false` |
| `FLOWGAME_EXECUTION_LOG_PATH` | 日志文件路径 | 本地 `logs/flowgame-execution.log`；Docker `/var/log/flowgame/execution.log` |
| `FLOWGAME_EXECUTION_LOG_HOST_DIR` | 仅 compose：宿主机日志目录 | `deploy/logs/api` |
| `FLOWGAME_EXECUTION_LOG_CONSOLE` | 是否同时输出到控制台 | `true` |
| `FLOWGAME_EXECUTION_LOG_LEVEL` | `INFO` / `DEBUG` 等 | `INFO` |
| `FLOWGAME_EXECUTION_LOG_BACKUP_COUNT` | 按天滚动时保留的历史日文件数（不含当天） | `5` |
| `FLOWGAME_EXECUTION_LOG_FILE_FIELD_MAX_LEN` | 写文件时单字段最大字符；`0`=不截断 | `50000` |
| `FLOWGAME_EXECUTION_LOG_CONSOLE_FIELD_MAX_LEN` | 控制台打印时单字段最大字符；`0`=不截断 | `800` |

在 `deploy/.env` 中开启示例：

```env
FLOWGAME_EXECUTION_LOG_ENABLED=true
FLOWGAME_EXECUTION_LOG_PATH=/var/log/flowgame/execution.log
FLOWGAME_EXECUTION_LOG_HOST_DIR=./logs/api
```

`docker compose` 已将宿主机 `FLOWGAME_EXECUTION_LOG_HOST_DIR` 挂载到容器 `/var/log/flowgame`，**无需修改 Dockerfile 的 CMD**（仍为 `uvicorn … --port 8008`）。重新构建并启动 api 后查看：

```bash
tail -f deploy/logs/api/execution.log
```

---

## 十一、清空 Qdrant 数据（知识库向量）

当 Qdrant 因旧数据格式无法启动（如 `unknown variant on_disk`），且**不需要保留已有知识库**时，可直接删掉向量卷数据。

**影响**：所有知识库 Collection 与已上传文档的向量都会丢失，需在编辑器里**重新上传**知识库文件。

```bash
cd deploy

# 停掉 qdrant
docker compose stop qdrant

# 删掉整个 Qdrant 数据卷（compose 项目名多为 deploy，卷名 deploy_qdrant_data）
docker volume rm deploy_qdrant_data

# 若卷名不确定：docker volume ls | grep qdrant

# 重新启动
docker compose up -d qdrant

# 确认就绪
curl -s http://127.0.0.1:6333/readyz
```

只删单个不兼容的 Collection（保留其它库）：

```bash
docker compose stop qdrant
docker run --rm -v deploy_qdrant_data:/qdrant/storage alpine \
  rm -rf "/qdrant/storage/collections/flowgame_日常问题_doc"
docker compose up -d qdrant
```

Redis 里的**流程 JSON** 不受影响；仅 Qdrant 向量数据被清。

---

## 十二、常见问题

| 现象 | 处理 |
|------|------|
| `build api` 卡在 `apt-get` 很久 | 新版 Dockerfile 已去掉 apt 安装；同步代码后 `docker compose build --no-cache api`。若卡在 `pip install`（torch 较大），可配置 `EMBEDDING_API_URL` 或 pip 镜像 |
| `build api` 报错 `"/.env": not found` | 镜像不再打包 `.env`；在 `deploy/` 下准备 `cp .env.example .env` 并编辑，compose 通过 `env_file` 在**运行时**注入 |
| `build api` 报错找不到 `flowgame_python` | 确认两个仓库并列克隆，路径为 `../flowgame_python` |
| `api` 一直 `starting` / `unhealthy` | `docker compose logs api` 查看；常见为依赖安装慢或端口被占用 |
| `curl -I http://127.0.0.1:8009` 报 `Connection reset by peer` | 确认 `nginx.conf` 为 **`listen 8009`**，且 `docker-compose` 端口映射为 **`8009:8009`**（内外一致）；API 反代仍用 **`http://api:8008`**，不要写宿主机 IP |
| 页面能开，保存/列表失败 | 检查 `redis` 容器是否运行：`docker compose ps redis` |
| Qdrant 启动 Panic `unknown variant on_disk` | 卷内数据与当前 Qdrant 版本不兼容；可删旧数据后重启（知识库需重新上传），见下文「清空 Qdrant 数据」 |
| 知识库失败 | 检查 `qdrant` 容器；配置 `EMBEDDING_API_URL` 或挂载本地模型 |
| 试运行「模型调用」失败 | 在节点属性里检查 `apiKey`、`modelProvider`、`modelName`（存在流程 JSON 中） |
| 试运行旧版「大模型」失败 | 检查 `.env` 中 `DEEPSEEK_API_KEY` 等（仅 `llmNode` 使用） |
| 前端改了代码不生效 | 执行 `docker compose up -d --build web`（生产镜像是构建产物，非热更新） |
| 端口冲突 | 修改 `deploy/.env` 中 `FLOWGAME_WEB_PORT` / `FLOWGAME_API_PORT` |

---

## 十三、相关文件索引

| 文件 | 说明 |
|------|------|
| `deploy/docker-compose.yml` | 一键编排 web / api / redis / qdrant |
| `deploy/Dockerfile` | 前端多阶段构建（Node 构建 + Nginx） |
| `deploy/nginx.conf` | 静态资源 + `/api` 反代 |
| `deploy/.env.example` | 环境变量模板 |
| `flowgame_python/Dockerfile` | 后端镜像（uvicorn 生产模式，无 reload） |

本地开发（非 Docker）仍见 [README.md](README.md)；后端说明见 **flowgame_python** 仓库的 `README.md`。
