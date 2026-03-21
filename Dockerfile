# ============================================================
# SGM App - Dockerfile
# Multi-stage build: deps → build frontend → production runner
# Stack: Node 22 + PostgreSQL (pg driver) + Vite SPA
# ============================================================

# ── Stage 1: Install ALL dependencies ──────────────────────
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build frontend assets ────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Recebe variáveis de ambiente em tempo de build (necessário pro Vite vazar pro bundle via import.meta.env.*)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APP_URL

ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APP_URL=$VITE_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Vite SPA → outputs to /app/dist
RUN npx vite build

# ── Stage 3: Production runner ─────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Install tini for proper signal handling + curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends tini curl && \
    rm -rf /var/lib/apt/lists/*

# Copy ALL node_modules (tsx is needed at runtime)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server source files and config
COPY server.ts tsconfig.json package.json ./
COPY src/server ./src/server

# Environment
ENV NODE_ENV=production

# Healthcheck — usa a mesma porta que o server (PORT ou 3000)
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["tini", "--"]

# Run server with tsx (local, not npx)
CMD ["node_modules/.bin/tsx", "server.ts"]
