# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma  
# ADD THIS
RUN npx prisma generate  
# ADD THIS
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
RUN apk add --no-cache curl  # ADD THIS
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma 
 # ADD THIS

CMD ["npm", "run", "start"]