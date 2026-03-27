# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema first
COPY prisma ./prisma

# Install dependencies
RUN npm ci && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Build frontend
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Build Docusaurus docs and ensure dist/docs exists
WORKDIR /app/docs
RUN npm ci && npm cache clean --force
RUN npm run build || true
RUN mkdir -p /app/dist/docs && \
    if [ -d "/app/docs/build" ]; then cp -r /app/docs/build/. /app/dist/docs/; \
    else echo "<html><body><h1>Docs build not available</h1></body></html>" > /app/dist/docs/index.html; fi

WORKDIR /app

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install utilities (use mirror fallback to handle transient DNS issues)
RUN apk update --no-cache || true && \
    apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy files from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch user
USER nodejs

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -sf http://localhost:3000/api/health || exit 1

# Start container
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
