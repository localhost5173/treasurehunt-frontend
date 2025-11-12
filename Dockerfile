# Stage 1: Build
FROM node:22-bullseye-slim AS builder
WORKDIR /app

# Install npm
RUN corepack enable && corepack prepare npm@latest --activate

# Install dependencies first for caching
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Copy all files and build
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-bullseye-slim
WORKDIR /app

# Install npm
RUN corepack enable && corepack prepare npm@latest --activate

# Copy built app and package files
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install only production dependencies (adapter-node must be in dependencies!)
RUN npm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["node", "server.js"]
