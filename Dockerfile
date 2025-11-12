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

# Copy built app from adapter-node output
COPY --from=builder /app/build ./

# Install production dependencies if needed (adapter-node bundles everything)
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "index.js"]
