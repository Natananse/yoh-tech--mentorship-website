# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY yoh-app-academy/package.json ./yoh-app-academy/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
ARG NEXT_PUBLIC_CONTACT_EMAIL=""
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
COPY yoh-app-academy ./yoh-app-academy
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV YOH_DATA_DIR=/app/data
WORKDIR /app
RUN mkdir -p /app/data && chown node:node /app/data
COPY --from=builder --chown=node:node /app/yoh-app-academy/.next/standalone ./
COPY --from=builder --chown=node:node /app/yoh-app-academy/scripts/setup-admin.mjs ./yoh-app-academy/scripts/setup-admin.mjs
USER node
VOLUME ["/app/data"]
EXPOSE 3002
CMD ["node", "yoh-app-academy/server.js"]
