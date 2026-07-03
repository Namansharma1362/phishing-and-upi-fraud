# ============================================================
#  SentinelAI Frontend — Dockerfile (Development)
#  Node 20 LTS on Alpine for a minimal image.
#  node_modules are installed inside the container to avoid
#  OS-specific native module conflicts on Windows hosts.
# ============================================================

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer — only invalidated when package.json changes)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source (hot reload is handled by docker-compose volume mount)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
