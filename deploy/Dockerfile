# FlowGame 前端：构建官方编辑器静态资源，由 Nginx 提供访问
# 国内服务器构建可加：--build-arg NPM_REGISTRY=https://registry.npmmirror.com
FROM node:20-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org
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
