# Stage 1: Build
FROM node:22-bullseye-slim AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies first for caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy all files and build
COPY . .
RUN pnpm run build

# Stage 2: Runtime
FROM node:22-bullseye-slim
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built app and package files
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install only production dependencies (adapter-node must be in dependencies!)
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["node", "server.js"]
