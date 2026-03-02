# ============================================================
# SGM App - Dockerfile
# Multi-stage build: deps → build frontend → production runner
# ============================================================

# ── Stage 1: Install dependencies ──────────────────────────
FROM node:22-slim AS deps

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (dev included for build stage)
# better-sqlite3 requires build tools for native compilation
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm ci && \
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# ── Stage 2: Build frontend assets ────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Vite SPA → outputs to /app/dist
RUN npx vite build

# ── Stage 3: Production runner ─────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Install only what's needed for native modules at runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends tini && \
    rm -rf /var/lib/apt/lists/*

# Copy node_modules from deps stage (includes better-sqlite3 native build)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server source files and config
COPY server.ts tsconfig.json package.json ./
COPY src/server ./src/server

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use tini as init system for proper signal handling
ENTRYPOINT ["tini", "--"]

# Run server with tsx (resolves .ts imports and ESM correctly)
CMD ["npx", "tsx", "server.ts"]
