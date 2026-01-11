# CivicWatch OSINT Intelligence Platform
# Multi-stage Docker build

# ================================
# Stage 1: Build Frontend
# ================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# ================================
# Stage 2: Production Server
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init and curl for proper signal handling and health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S civicwatch -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy server files
COPY server/ ./server/

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Set ownership
RUN chown -R civicwatch:nodejs /app

# Switch to non-root user
USER civicwatch

# Expose the obscure port
EXPOSE 47391

# Environment variables
ENV NODE_ENV=production
ENV PORT=47391

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:47391/api/health || exit 1

# Start server with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
