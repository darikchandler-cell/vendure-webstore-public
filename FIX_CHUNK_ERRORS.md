# Fix Next.js Chunk Loading Errors

## Problem

You're seeing these errors in the browser console:
- `GET https://www.hunterirrigationsupply.com/_next/static/chunks/app/page-0de7e34630954ce8.js 400 (Bad Request)`
- `Refused to execute script because its MIME type ('text/html') is not executable`
- `ChunkLoadError: Loading chunk 931 failed`

## Root Cause

The `docker-compose.yml` was mounting `./apps/storefront:/app` which **overwrites** the built `.next` directory inside the container. 

The Dockerfile builds Next.js and copies the built artifacts (`.next/standalone` and `.next/static`) into the image, but then the volume mount replaces everything with the host directory (which doesn't have a build).

## Solution

1. **Removed volume mounts** from storefront in `docker-compose.yml`
2. **Updated Dockerfile** to accept build-time environment variables
3. **Rebuild the container** so Next.js chunks are baked into the image

## Quick Fix (One Command)

SSH to your server and run:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation && git pull origin main && bash infra/fix-chunk-errors.sh
```

## Manual Fix Steps

### Step 1: Connect to Server

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
```

### Step 2: Update Code

```bash
git pull origin main
```

### Step 3: Ensure Environment Variables

```bash
# Make sure .env has NEXT_PUBLIC_VENDURE_API_URL
echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" >> .env
sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' .env
```

### Step 4: Stop and Rebuild Storefront

```bash
# Stop storefront
docker compose stop storefront
docker compose rm -f storefront

# Rebuild with build args (NEXT_PUBLIC_ vars must be set at build time)
docker compose build \
  --build-arg NEXT_PUBLIC_VENDURE_API_URL="https://hunterirrigationsupply.com" \
  --build-arg NEXT_PUBLIC_US_CHANNEL_TOKEN="${NEXT_PUBLIC_US_CHANNEL_TOKEN:-}" \
  --build-arg NEXT_PUBLIC_CA_CHANNEL_TOKEN="${NEXT_PUBLIC_CA_CHANNEL_TOKEN:-}" \
  storefront

# Start storefront
docker compose up -d storefront

# Wait for it to start
sleep 20
```

### Step 5: Verify

```bash
# Check container is running
docker compose ps storefront

# Test homepage
curl -I http://localhost:3001

# Test a Next.js chunk (should return 200 with JavaScript content type)
curl -I -H "Accept: application/javascript" http://localhost:3001/_next/static/chunks/webpack-0150bfd386741eda.js

# Check logs
docker compose logs storefront --tail 20
```

## What Changed

### docker-compose.yml

**Before:**
```yaml
volumes:
  - ./apps/storefront:/app      # ❌ Overwrites built .next directory
  - /app/node_modules
  - /app/.next
```

**After:**
```yaml
# Volumes removed - use built image instead
# The Dockerfile builds Next.js and copies .next/standalone and .next/static into the image
```

### Dockerfile

**Added build args** to accept `NEXT_PUBLIC_` environment variables at build time:

```dockerfile
ARG NEXT_PUBLIC_VENDURE_API_URL
ARG NEXT_PUBLIC_US_CHANNEL_TOKEN
ARG NEXT_PUBLIC_CA_CHANNEL_TOKEN

ENV NEXT_PUBLIC_VENDURE_API_URL=${NEXT_PUBLIC_VENDURE_API_URL}
ENV NEXT_PUBLIC_US_CHANNEL_TOKEN=${NEXT_PUBLIC_US_CHANNEL_TOKEN}
ENV NEXT_PUBLIC_CA_CHANNEL_TOKEN=${NEXT_PUBLIC_CA_CHANNEL_TOKEN}
```

## Why This Works

1. **Next.js standalone output**: The Dockerfile uses `output: 'standalone'` which creates a self-contained build
2. **Build artifacts in image**: `.next/standalone` and `.next/static` are copied into the image during build
3. **No volume overwrites**: Without volume mounts, the built artifacts remain intact
4. **Build-time env vars**: `NEXT_PUBLIC_` variables are bundled into JavaScript during build, not at runtime

## Testing After Fix

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Open browser console** (F12) - should see no chunk loading errors
3. **Test the site**:
   - https://hunterirrigationsupply.com
   - https://hunterirrigationsupply.com/products
4. **Verify chunks are accessible**:
   ```bash
   curl -I https://hunterirrigationsupply.com/_next/static/chunks/webpack-0150bfd386741eda.js
   # Should return: HTTP/2 200 with content-type: application/javascript
   ```

## Troubleshooting

### Still seeing 400 errors?

1. **Verify chunks exist in container**:
   ```bash
   docker compose exec storefront ls -la .next/static/chunks/
   ```

2. **Check if volume mounts are still active**:
   ```bash
   docker compose config | grep -A 10 storefront
   # Should NOT show volumes: section
   ```

3. **Rebuild without cache**:
   ```bash
   docker compose build --no-cache storefront
   docker compose up -d storefront
   ```

### Chunks return HTML instead of JavaScript?

This means the chunks don't exist and Next.js is returning an error page. Verify:
1. Container was rebuilt (not just restarted)
2. Build completed successfully
3. No volume mounts overwriting `.next` directory

### Need to update code?

After making code changes:
1. Rebuild the container: `docker compose build storefront`
2. Restart: `docker compose restart storefront`

**Note**: In production, you should rebuild the container for any code changes since volumes are removed.

## Rollback

If something goes wrong:

```bash
cd /opt/hunter-irrigation
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
docker compose build storefront
docker compose up -d storefront
```




