# Remix Storefront - Monorepo Integration Guide

This guide explains how to integrate this Remix storefront into a Vendure monorepo with multi-channel support.

## Overview

This Remix storefront has been configured to work with Vendure's multi-channel system, supporting:
- **US Channel**: Default channel for US market
- **CA Channel**: Canadian channel with separate pricing/currency

## Environment Variables

### Required Variables

```env
# Vendure API Configuration
VENDURE_API_URL=http://localhost:3000
# For production/Docker:
# VENDURE_API_URL=http://vendure-api:3000
# For production with domain:
# VENDURE_API_URL=https://hunterirrigationsupply.com

# Channel Tokens (REQUIRED for multi-channel support)
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2

# Node Environment
NODE_ENV=development
# or production

# Session Secret (REQUIRED in production)
SESSION_SECRET=your-session-secret-here
# Generate with: openssl rand -base64 32

# Public API URL (for client-side GraphQL)
PUBLIC_VENDURE_API_URL=http://localhost:3000
# Production:
# PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
```

### Optional Variables

```env
# Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Analytics & Monitoring
GA_MEASUREMENT_ID=G-XXXXXXXXXX
SENTRY_DSN=https://...

# App URL (for absolute URLs in metadata)
APP_URL=https://your-storefront-domain.com
```

## Channel Detection

The storefront automatically detects the channel based on the request hostname:

- **CA Channel**: Detected when hostname contains `hunterirrigation.ca` or `.ca`
- **US Channel**: Default for all other domains

### Channel Detection Logic

```typescript
// app/utils/channel-detection.ts
export function detectChannel(request: Request): ChannelCode {
  const hostname = new URL(request.url).hostname;
  
  if (hostname.includes('hunterirrigation.ca') || hostname.includes('.ca')) {
    return 'ca';
  }
  
  return 'us';
}
```

## GraphQL Integration

The GraphQL wrapper automatically includes the channel token in all requests:

```typescript
// app/graphqlWrapper.ts
// Channel token is automatically added to headers
headers.append('vendure-token', channelConfig.token);
```

### How It Works

1. **Request comes in** → Channel is detected from hostname
2. **Channel token retrieved** → From `US_CHANNEL_TOKEN` or `CA_CHANNEL_TOKEN` env vars
3. **Token added to headers** → All GraphQL requests include `vendure-token` header
4. **Vendure processes request** → Uses token to determine channel context

## Integration Steps

### 1. Add to Monorepo

```bash
# Copy Remix app to monorepo
cp -r /path/to/remix-vendure-theme /path/to/vendure-sites/apps/remix-storefront

# Or clone from git
cd apps
git clone <your-remix-theme-repo-url> remix-storefront
```

### 2. Update Workspace Configuration

The `pnpm-workspace.yaml` should already include `apps/*`, so your Remix app will be automatically included.

### 3. Create Environment File

Create `apps/remix-storefront/.env`:

```env
VENDURE_API_URL=http://localhost:3000
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2
NODE_ENV=development
SESSION_SECRET=dev-session-secret-change-in-production-min-32-chars
PUBLIC_VENDURE_API_URL=http://localhost:3000
```

### 4. Update Root package.json

Add Remix scripts to the root `package.json`:

```json
{
  "scripts": {
    "dev": "pnpm --filter @hunter-irrigation/api dev & pnpm --filter @hunter-irrigation/storefront dev & pnpm --filter @hunter-irrigation/remix-storefront dev",
    "build": "pnpm --filter @hunter-irrigation/api build && pnpm --filter @hunter-irrigation/storefront build && pnpm --filter @hunter-irrigation/remix-storefront build",
    "start": "pnpm --filter @hunter-irrigation/api start & pnpm --filter @hunter-irrigation/storefront start & pnpm --filter @hunter-irrigation/remix-storefront start"
  }
}
```

### 5. Docker Configuration (Optional)

Add to `docker-compose.yml`:

```yaml
  remix-storefront:
    build:
      context: ./apps/remix-storefront
      dockerfile: Dockerfile
    container_name: hunter-irrigation-remix-storefront
    restart: unless-stopped
    environment:
      NODE_ENV: production
      VENDURE_API_URL: http://vendure-api:3000
      PUBLIC_VENDURE_API_URL: https://hunterirrigationsupply.com
      US_CHANNEL_TOKEN: ${US_CHANNEL_TOKEN:-e8feb84eb1c9a971babd442996f62ed2}
      CA_CHANNEL_TOKEN: ${CA_CHANNEL_TOKEN:-829a8999792172126c5af5458a47caa2}
      SESSION_SECRET: ${SESSION_SECRET}
      PORT: 3002
    ports:
      - "3002:3002"
    depends_on:
      - vendure-api
    networks:
      - hunter-irrigation-network
```

### 6. Caddy Configuration (Optional)

If using Caddy for reverse proxy, update `infra/caddy/Caddyfile`:

```caddy
# US Storefront
hunterirrigationsupply.com {
    reverse_proxy remix-storefront:3002
}

# CA Storefront
hunterirrigation.ca {
    reverse_proxy remix-storefront:3002
}
```

## Testing

### 1. Install Dependencies

```bash
cd apps/remix-storefront
pnpm install
```

### 2. Run Development Server

```bash
# From app directory
pnpm dev

# Or from root
pnpm --filter @hunter-irrigation/remix-storefront dev
```

### 3. Verify Channel Detection

1. **Test US Channel**:
   - Visit `http://localhost:8002` (or your dev URL)
   - Check browser DevTools → Network tab
   - Verify GraphQL requests include `vendure-token: e8feb84eb1c9a971babd442996f62ed2`

2. **Test CA Channel**:
   - Add to `/etc/hosts`: `127.0.0.1 hunterirrigation.ca`
   - Visit `http://hunterirrigation.ca:8002`
   - Verify GraphQL requests include `vendure-token: 829a8999792172126c5af5458a47caa2`

### 4. Verify GraphQL Connection

- Products should load correctly
- Currency should match channel (USD for US, CAD for CA)
- Prices should reflect channel-specific pricing

## Key Files

### Channel Detection
- `app/utils/channel-detection.ts` - Channel detection and token management

### GraphQL Integration
- `app/graphqlWrapper.ts` - GraphQL client with channel token support
- `app/constants.ts` - API URL configuration

### Environment
- `app/utils/env-validation.ts` - Environment variable validation

## Troubleshooting

### Channel Token Not Working

1. **Check environment variables**:
   ```bash
   echo $US_CHANNEL_TOKEN
   echo $CA_CHANNEL_TOKEN
   ```

2. **Verify token format**: Tokens should be 32-character hex strings

3. **Check request headers**: Use browser DevTools to verify `vendure-token` header is present

### API URL Issues

1. **Ensure `/shop-api` endpoint**: The API URL should end with `/shop-api`
   - ✅ `http://localhost:3000/shop-api`
   - ❌ `http://localhost:3000`

2. **Check CORS**: Ensure Vendure API allows requests from your storefront domain

### Build Issues

1. **TypeScript errors**: Some type conflicts with Cloudflare Workers types are expected and don't affect the build

2. **Build command**: Use `yarn build:nf` for Netlify or `yarn build:cf` for Cloudflare Pages

## Production Deployment

### Environment Variables Checklist

- [ ] `VENDURE_API_URL` - Production Vendure API URL
- [ ] `PUBLIC_VENDURE_API_URL` - Public-facing API URL (for client-side)
- [ ] `US_CHANNEL_TOKEN` - US channel token
- [ ] `CA_CHANNEL_TOKEN` - CA channel token
- [ ] `SESSION_SECRET` - Secure random secret (32+ chars)
- [ ] `NODE_ENV=production`
- [ ] `STRIPE_PUBLISHABLE_KEY` (if using Stripe)
- [ ] `GA_MEASUREMENT_ID` (optional)
- [ ] `SENTRY_DSN` (optional)

### Pre-Deployment

```bash
# Run pre-launch checks
yarn pre-launch:check

# Verify environment
yarn verify:env

# Build for production
yarn build:nf  # Netlify
# or
yarn build:cf  # Cloudflare Pages
```

## Support

For issues or questions:
- Check the [Vendure Documentation](https://docs.vendure.io)
- Review the [Remix Documentation](https://remix.run/docs)
- See `PRODUCTION_READINESS_ASSESSMENT.md` for production checklist

