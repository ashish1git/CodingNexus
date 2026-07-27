# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached unless package files change)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy app source (server + src)
COPY server ./server
COPY src ./src
COPY public ./public
COPY index.html vite.config.js prisma.config.ts ./

# Build frontend
ARG VITE_API_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_CLOUDINARY_NOTES_PRESET
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}
ENV VITE_CLOUDINARY_UPLOAD_PRESET=${VITE_CLOUDINARY_UPLOAD_PRESET}
ENV VITE_CLOUDINARY_NOTES_PRESET=${VITE_CLOUDINARY_NOTES_PRESET}
RUN npm run build

# ── Docs build ── (separate WORKDIR for independent caching)
WORKDIR /tmp/docs-build
COPY docs/package*.json ./
RUN npm ci && npm cache clean --force
COPY docs/ ./
RUN npm run build || true
RUN mkdir -p /app/dist/docs && \
    if [ -d "/tmp/docs-build/build" ]; then cp -r /tmp/docs-build/build/. /app/dist/docs/; \
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

# Copy only production essentials from builder
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
