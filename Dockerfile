# --- Stage 1: Build the React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies first for caching
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Prepare the Backend and Final Image ---
FROM node:20-alpine
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --only=production

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Cloud Run will override this using the PORT env var)
ENV PORT=3001
EXPOSE 3001

# Start the unified application
CMD ["npm", "--prefix", "backend", "start"]
