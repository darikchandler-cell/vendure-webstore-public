FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --include=dev

# Build the application
FROM base AS builder
ENV BUILD_ID=v9-email-fix
WORKDIR /app
COPY package.json ./
# Use npm to avoid pnpm structure issues in build
RUN npm install
COPY . .
RUN ./node_modules/.bin/tsc

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vendure

COPY --from=builder --chown=vendure:nodejs /app/dist ./dist
COPY --from=builder --chown=vendure:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vendure:nodejs /app/package.json ./package.json

# Create assets and email directories and set permissions
RUN mkdir -p /app/static/assets /app/static/email/templates/partials
RUN chown -R vendure:nodejs /app/static

USER vendure

EXPOSE 3000

CMD ["node", "dist/index.js"]

