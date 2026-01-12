# -------------------- Stage 1: Builder --------------------
FROM node:20-alpine AS builder
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
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S authuser -u 1001 -G nodejs

# Install production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts
COPY --from=builder --chown=authuser:nodejs /app/dist ./dist
COPY --from=builder --chown=authuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=authuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=authuser:nodejs /app/prisma.config.ts ./

USER authuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001
CMD ["node", "dist/server.js"]
