FROM node:20-alpine AS base

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json ./

# Using npm install to avoid pnpm symlink issues in Docker
# and ensure flat node_modules
RUN npm install

COPY . .

# Build arguments need to be available during build
ARG NEXT_PUBLIC_VENDURE_API_URL
ARG NEXT_PUBLIC_US_CHANNEL_TOKEN
ARG NEXT_PUBLIC_CA_CHANNEL_TOKEN

ENV NEXT_PUBLIC_VENDURE_API_URL=${NEXT_PUBLIC_VENDURE_API_URL}
ENV NEXT_PUBLIC_US_CHANNEL_TOKEN=${NEXT_PUBLIC_US_CHANNEL_TOKEN}
ENV NEXT_PUBLIC_CA_CHANNEL_TOKEN=${NEXT_PUBLIC_CA_CHANNEL_TOKEN}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
# We copy public folder
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
