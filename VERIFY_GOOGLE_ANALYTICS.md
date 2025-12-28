# Google Analytics Verification Guide

## Current Status

**Issue**: Google Analytics code is in the repository but not yet deployed to production.

**Root Cause**: The storefront Docker container needs to be rebuilt with the updated code.

## Verification Steps

### 1. Check if GA Code is in Repository

```bash
# Local check
cat apps/storefront/app/layout.tsx | grep "G-BSL225PG0B"
cat apps/remix-storefront/app/root.tsx | grep "G-9LK4JKHQSP"
```

### 2. Check if GA Code is on Server

```bash
ssh root@178.156.194.89 "cat /opt/hunter-irrigation/apps/storefront/app/layout.tsx | grep 'GA_US_ID'"
```

### 3. Check if GA is in Live HTML

```bash
# USA Site
curl -s https://hunterirrigationsupply.com | grep -o 'G-BSL225PG0B'

# Canada Site  
curl -s https://hunterirrigation.ca | grep -o 'G-9LK4JKHQSP'
```

### 4. Browser Verification

1. Open https://hunterirrigationsupply.com
2. Open DevTools (F12) → Network tab
3. Filter for "gtag" or "googletagmanager"
4. Refresh page
5. Look for requests to `www.googletagmanager.com/gtag/js?id=G-BSL225PG0B`

Repeat for https://hunterirrigation.ca (should show `G-9LK4JKHQSP`)

## Deployment Required

The code is in the repo but the container needs rebuilding:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
docker-compose stop storefront
docker-compose rm -f storefront
docker-compose build --no-cache storefront
docker-compose up -d storefront
```

Or trigger via GitHub Actions:
- Go to Actions → "Deploy Storefront Only" → Run workflow

## Expected Results

✅ **USA Site** (`hunterirrigationsupply.com`):
- Should load: `G-BSL225PG0B`
- Script: `https://www.googletagmanager.com/gtag/js?id=G-BSL225PG0B`

✅ **Canada Site** (`hunterirrigation.ca`):
- Should load: `G-9LK4JKHQSP`
- Script: `https://www.googletagmanager.com/gtag/js?id=G-9LK4JKHQSP`

## Troubleshooting

If GA still doesn't appear after rebuild:

1. **Check container logs:**
   ```bash
   docker-compose logs storefront | tail -50
   ```

2. **Verify build included new code:**
   ```bash
   docker exec hunter-irrigation-storefront cat /app/app/layout.tsx | grep GA_US_ID
   ```

3. **Check Next.js build output:**
   ```bash
   docker exec hunter-irrigation-storefront ls -la /app/.next/
   ```

4. **Force full rebuild:**
   ```bash
   docker-compose build --no-cache --pull storefront
   docker-compose up -d storefront
   ```


