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

# Build frontend with API base URL
# These are required build arguments from CI/CD or manual build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build


# Production stage
FROM node:20-alpine

WORKDIR /app

# Install utilities for health checks and monitoring
RUN apk add --no-cache dumb-init wget curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy files from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port (matches docker-compose.yml)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application with dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
