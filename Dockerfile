# syntax=docker/dockerfile:1.7
# Single multi-target Dockerfile for the whole workspace so the pnpm install layer is shared.
# Targets:
#   api       – production api / worker image (node dist/server.js | node dist/worker.js)
#   api-dev   – tsx watch with src bind-mounted (docker-compose.dev.yml)
#   web-dev   – vite dev server with src bind-mounted (docker-compose.dev.yml)
#   nginx     – nginx serving the built web app and proxying /api (docker-compose.yml)
#   nginx-dev – nginx proxying / to the vite container and /api to the api (docker-compose.dev.yml)

ARG NODE_VERSION=22
ARG NGINX_VERSION=1.27

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    HUSKY=0 \
    CI=1
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------------------------------------------------------
# Install all workspace dependencies from lockfile (only manifests copied => cached layer).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY api/package.json api/
COPY web/package.json web/
COPY packages/api-server-sdk/package.json packages/api-server-sdk/
COPY packages/openapi/package.json packages/openapi/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Compile the generated Smithy packages (needed by api at runtime and by web at build time).
FROM deps AS generated
COPY packages ./packages
RUN pnpm --filter "./packages/api-server-sdk" run build

# ---------------------------------------------------------------------------
FROM generated AS build
COPY api ./api
COPY web ./web
RUN pnpm --filter api run build \
 && pnpm --filter web run build \
 && pnpm --filter api deploy --prod --legacy /out/api

# ---------------------------------------------------------------------------
FROM base AS api
ENV NODE_ENV=production
COPY --from=build /out/api /app
USER node
EXPOSE 3000
# Health checks are defined per service in docker-compose.yml (the worker shares this image).
CMD ["node", "dist/server.js"]

# ---------------------------------------------------------------------------
FROM generated AS api-dev
COPY api ./api
WORKDIR /app/api
EXPOSE 3000
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
FROM generated AS web-dev
COPY web ./web
WORKDIR /app/web
EXPOSE 5173
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
FROM nginx:${NGINX_VERSION}-alpine AS nginx-base
ENV NGINX_ENVSUBST_FILTER=^APP_
COPY nginx/proxy.conf /etc/nginx/proxy.conf

FROM nginx-base AS nginx-dev
COPY nginx/templates-dev/ /etc/nginx/templates/

FROM nginx-base AS nginx
COPY nginx/templates/ /etc/nginx/templates/
COPY --from=build /app/web/dist /usr/share/nginx/html
