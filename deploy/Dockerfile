# FlowGame 前端：构建官方编辑器静态资源，由 Nginx 提供访问
#
# 国内服务器示例：
#   docker compose build web \
#     --build-arg NODE_IMAGE=docker.m.daocloud.io/library/node:20-alpine
ARG NODE_IMAGE=node:20-alpine
# 构建阶段默认用 npmmirror；海外服务器可传 --build-arg NPM_REGISTRY=https://registry.npmjs.org
ARG NPM_REGISTRY=https://registry.npmmirror.com

FROM ${NODE_IMAGE} AS builder

ARG NPM_REGISTRY
# 不用 corepack（会从 registry.npmjs.org 拉 pnpm，国内易失败），改 npm 全局安装
RUN npm config set registry "${NPM_REGISTRY}" \
  && npm install -g pnpm@9.15.0

WORKDIR /app

RUN pnpm config set registry "${NPM_REGISTRY}" \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-mintimeout 20000 \
  && pnpm config set fetch-retry-maxtimeout 120000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/editor/dist /usr/share/nginx/html

EXPOSE 8009
