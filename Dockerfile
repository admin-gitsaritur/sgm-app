# ============================================================
# SGM App - Dockerfile
# Multi-stage build: deps → build frontend → production runner
# Stack: Node 22 + PostgreSQL (pg driver) + Vite SPA
# ============================================================

# ── Stage 1: Install dependencies ──────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# pg driver is pure JS — no native build tools needed
RUN npm ci --omit=dev

# Also install dev deps in a separate layer for the build stage
FROM node:22-slim AS dev-deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build frontend assets ────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=dev-deps /app/node_modules ./node_modules
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

# Copy production node_modules (no dev deps)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server source files and config
COPY server.ts tsconfig.json package.json ./
COPY src/server ./src/server

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Healthcheck — verifica se o server responde
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini as init system for proper signal handling
ENTRYPOINT ["tini", "--"]

# Run server with tsx (resolves .ts imports and ESM correctly)
CMD ["npx", "tsx", "server.ts"]
