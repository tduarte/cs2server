# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy frontend source and config files
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/frontend ./src/frontend

# Build frontend
RUN npm run build:frontend

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy backend source
COPY src/backend ./src/backend
COPY src/shared ./src/shared

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./public

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/backend/server.js"]

