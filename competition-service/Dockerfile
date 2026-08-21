# ──────────────────────────────────────────────
# Competition Service Dockerfile
# node:20-alpine — matches main app version
# ──────────────────────────────────────────────

# Stage 1: Install dependencies & generate Prisma client
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Layer cache: install deps before copying source
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY . .

# ──────────────────────────────────────────────
# Stage 2: Lean production image
# ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Runtime utilities
RUN apk add --no-cache openssl dumb-init curl

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only what's needed from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

USER nodejs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -sf http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
