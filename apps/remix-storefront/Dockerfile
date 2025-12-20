FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG VENDURE_API_URL
ARG PUBLIC_VENDURE_API_URL
ARG US_CHANNEL_TOKEN
ARG CA_CHANNEL_TOKEN
ARG SESSION_SECRET
ARG NODE_ENV=production

ENV VENDURE_API_URL=${VENDURE_API_URL}
ENV PUBLIC_VENDURE_API_URL=${PUBLIC_VENDURE_API_URL}
ENV US_CHANNEL_TOKEN=${US_CHANNEL_TOKEN}
ENV CA_CHANNEL_TOKEN=${CA_CHANNEL_TOKEN}
ENV SESSION_SECRET=${SESSION_SECRET}
ENV NODE_ENV=${NODE_ENV}

# Build the application
RUN npm run build

# Production image, copy all the files and run remix-serve
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8002

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix

# Copy necessary files
COPY --from=builder --chown=remix:nodejs /app/build ./build
COPY --from=builder --chown=remix:nodejs /app/public ./public
COPY --from=builder --chown=remix:nodejs /app/package.json ./package.json
COPY --from=builder --chown=remix:nodejs /app/node_modules ./node_modules

USER remix

EXPOSE 8002

CMD ["npx", "remix-serve", "build"]

