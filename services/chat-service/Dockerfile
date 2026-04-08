# -------------------- Stage 1: Builder --------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy Prisma files
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client (NO DB URL REQUIRED)
RUN npx prisma generate

# Copy source & build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build


# -------------------- Stage 2: Production --------------------
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1004 -S nodejs \
 && adduser -S chatserviceuser -u 1004 -G nodejs

# Install production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts
COPY --from=builder --chown=chatserviceuser:nodejs /app/dist ./dist
COPY --from=builder --chown=chatserviceuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=chatserviceuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=chatserviceuser:nodejs /app/prisma.config.ts ./

USER chatserviceuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

EXPOSE 3004
CMD ["node", "dist/server.js"]