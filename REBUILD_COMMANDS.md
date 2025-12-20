# Rebuild Commands

## Quick Rebuild (One Command)

SSH to your server and run:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation && git pull origin main && bash infra/rebuild-all.sh
```

## What Gets Rebuilt

1. ✅ **API Container** - With enhanced error handling
2. ✅ **Storefront Container** - With correct API URL (CRITICAL FIX)
3. ✅ **Worker Container** - Background job processor
4. ✅ **Environment Variables** - Automatically configured

## Manual Rebuild Steps

If you prefer step-by-step:

```bash
# 1. Connect to server
ssh root@178.156.194.89

# 2. Go to project directory
cd /opt/hunter-irrigation

# 3. Pull latest code
git pull origin main

# 4. Update environment variables
echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" >> .env
sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' .env
mkdir -p apps/storefront
echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" > apps/storefront/.env

# 5. Stop services
docker compose down

# 6. Rebuild all containers
docker compose build vendure-api
docker compose build storefront
docker compose build vendure-worker

# 7. Start services
docker compose up -d

# 8. Wait for services to start
sleep 30

# 9. Check status
docker compose ps
docker compose logs --tail 20
```

## Why Rebuild is Required

The **storefront must be rebuilt** because:
- `NEXT_PUBLIC_` environment variables are bundled into the JavaScript at **build time**
- Simply restarting won't pick up the new API URL
- The browser needs the correct public URL, not the Docker internal service name

## Verify After Rebuild

1. **Check containers are running**:
   ```bash
   docker compose ps
   ```
   All should show "Up"

2. **Test endpoints**:
   ```bash
   curl -I http://localhost:3000/admin-api
   curl -I http://localhost:3000/shop-api
   curl -I http://localhost:3001
   ```

3. **Test in browser**:
   - https://hunterirrigationsupply.com/admin
   - https://hunterirrigationsupply.com
   - Both should load without 500 errors

4. **Check browser console** (F12):
   - No errors about API connection
   - Network requests should go to `https://hunterirrigationsupply.com/shop-api`

## Troubleshooting

### Build fails?
```bash
# Check Docker is running
docker ps

# Check disk space
df -h

# View build logs
docker compose build storefront --no-cache
```

### Still seeing 500 errors?
```bash
# Run diagnostics
bash infra/diagnose-500-errors.sh

# Check logs
docker compose logs -f
```

### Storefront still using old URL?
Make sure you:
1. ✅ Updated `.env` file
2. ✅ Updated `apps/storefront/.env` file
3. ✅ **Rebuilt** the container (not just restarted)
4. ✅ Waited for build to complete

## Quick One-Liner Rebuild

```bash
cd /opt/hunter-irrigation && git pull origin main && sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' .env && echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" > apps/storefront/.env && docker compose down && docker compose build && docker compose up -d && sleep 30 && docker compose ps
```




