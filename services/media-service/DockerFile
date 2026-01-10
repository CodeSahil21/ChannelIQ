# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency files first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1003 -S nodejs && \
    adduser -S mediaserviceuser -u 1003 -G nodejs

# Copy package files and install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application with proper ownership
COPY --from=builder --chown=mediaserviceuser:nodejs /app/dist ./dist

# Switch to non-root user
USER mediaserviceuser

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Expose port
EXPOSE 3003

# Start application directly with node for better performance
CMD ["npm", "run", "start"]
