# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S authuser -u 1001 -G nodejs

# Copy package files and install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application with proper ownership
COPY --from=builder --chown=authuser:nodejs /app/dist ./dist
COPY --from=builder --chown=authuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=authuser:nodejs /app/prisma ./prisma

# Switch to non-root user
USER authuser

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start application directly with node for better performance
CMD ["npm", "run", "start"]