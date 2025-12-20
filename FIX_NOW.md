# Fix 500 Errors - Run These Commands

## Step 1: Connect to Your Server

```bash
ssh root@178.156.194.89
```

## Step 2: Run This One Command

Copy and paste this entire command block:

```bash
cd /opt/hunter-irrigation && \
git pull origin main 2>/dev/null || echo "⚠️  Git pull skipped" && \
echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" >> .env && \
sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' .env 2>/dev/null || true && \
[ -f apps/storefront/.env ] && sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' apps/storefront/.env || echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" >> apps/storefront/.env && \
echo "🔨 Rebuilding storefront..." && \
docker compose build storefront && \
echo "🔄 Restarting services..." && \
docker compose restart storefront vendure-api && \
sleep 20 && \
echo "✅ Fix applied! Testing..." && \
curl -s -o /dev/null -w "Admin API: %{http_code}\n" http://localhost:3000/admin-api && \
curl -s -o /dev/null -w "Shop API: %{http_code}\n" http://localhost:3000/shop-api && \
curl -s -o /dev/null -w "Storefront: %{http_code}\n" http://localhost:3001 && \
echo "" && \
echo "✅ Done! Check your sites:" && \
echo "   - https://hunterirrigationsupply.com/admin" && \
echo "   - https://hunterirrigationsupply.com"
```

## What This Does

1. ✅ Updates code from git (if available)
2. ✅ Sets `NEXT_PUBLIC_VENDURE_API_URL` to the correct public URL
3. ✅ Rebuilds storefront container (required for env var changes)
4. ✅ Restarts services
5. ✅ Tests endpoints

## Alternative: Step-by-Step

If the one-liner doesn't work, run these commands one by one:

```bash
# 1. Go to project directory
cd /opt/hunter-irrigation

# 2. Pull latest code (if using git)
git pull origin main || echo "Skipping git pull"

# 3. Update root .env file
if grep -q "NEXT_PUBLIC_VENDURE_API_URL" .env; then
  sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' .env
else
  echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" >> .env
fi

# 4. Update storefront .env file
mkdir -p apps/storefront
if [ -f apps/storefront/.env ]; then
  if grep -q "NEXT_PUBLIC_VENDURE_API_URL" apps/storefront/.env; then
    sed -i 's|NEXT_PUBLIC_VENDURE_API_URL=.*|NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com|' apps/storefront/.env
  else
    echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" >> apps/storefront/.env
  fi
else
  echo "NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com" > apps/storefront/.env
fi

# 5. Rebuild storefront (IMPORTANT - env vars are bundled at build time)
docker compose build storefront

# 6. Restart services
docker compose restart storefront vendure-api

# 7. Wait for services to start
sleep 20

# 8. Check status
docker compose ps

# 9. Test endpoints
echo "Testing endpoints..."
curl -I http://localhost:3000/admin-api
curl -I http://localhost:3000/shop-api
curl -I http://localhost:3001
```

## Verify It Worked

After running the fix:

1. **Check container status**:
   ```bash
   docker compose ps
   ```
   All containers should show "Up"

2. **Check logs**:
   ```bash
   docker compose logs storefront --tail 20
   docker compose logs vendure-api --tail 20
   ```
   Should not show 500 errors

3. **Test in browser**:
   - Open: https://hunterirrigationsupply.com/admin
   - Open: https://hunterirrigationsupply.com
   - Both should load without 500 errors

## Still Having Issues?

Run the diagnostic script:

```bash
cd /opt/hunter-irrigation
bash infra/diagnose-500-errors.sh
```

This will identify the specific problem and provide recommendations.




