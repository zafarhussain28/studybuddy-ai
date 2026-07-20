# Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build Backend & Serve
FROM node:18-alpine
WORKDIR /app

# Copy backend files
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production
COPY server/ ./

# Copy built frontend from previous stage
# Assuming you might want to serve it via express in production (optional for Vercel, but good for Docker)
COPY --from=frontend-builder /app/client/dist ./public

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]
