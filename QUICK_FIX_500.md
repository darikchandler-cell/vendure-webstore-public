# Quick Fix for 500 Errors

## One-Command Fix (Recommended)

From your **local machine**, run:

```bash
cd /Users/workstationa/Library/CloudStorage/OneDrive-Personal/Cursor/vendure-sites
bash infra/deploy-fix-500.sh
```

This script will:
1. ✅ Connect to your production server
2. ✅ Pull latest code with fixes
3. ✅ Update environment variables
4. ✅ Rebuild storefront container (required for API URL fix)
5. ✅ Restart services
6. ✅ Verify everything is working

## What Was Fixed

### Critical Fix: Storefront API URL
- **Problem**: Storefront was trying to connect to `http://vendure-api:3000` (Docker internal name)
- **Solution**: Changed to use public URL `https://hunterirrigationsupply.com`
- **Why**: `NEXT_PUBLIC_` variables are bundled into client-side JavaScript, and browsers can't resolve Docker service names

### Enhanced Error Handling
- Added better error messages in API startup
- Improved diagnostics for database connection issues

## Manual Fix (If Script Doesn't Work)

If you prefer to fix manually, SSH to your server:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
```

Then run:

```bash
# 1. Pull latest code
git pull origin main

# 2. Update .env file
nano .env
# Set: NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com

# 3. Update storefront .env
nano apps/storefront/.env
# Set: NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com

# 4. Rebuild storefront (REQUIRED - env vars are bundled at build time)
docker compose build storefront

# 5. Restart services
docker compose restart storefront vendure-api

# 6. Wait for services to start
sleep 15

# 7. Verify
docker compose ps
docker compose logs storefront --tail 20
```

## Verify the Fix

After running the fix, test your sites:

1. **Admin Panel**: https://hunterirrigationsupply.com/admin
   - Should load without 500 errors
   - Check browser console (F12) for any errors

2. **Storefront**: https://hunterirrigationsupply.com
   - Should load without 500 errors
   - Products should load correctly

3. **API Endpoints**:
   ```bash
   curl -I https://hunterirrigationsupply.com/admin-api
   curl -I https://hunterirrigationsupply.com/shop-api
   # Should return 200, 400, or 401 (NOT 500)
   ```

## Troubleshooting

### Still seeing 500 errors?

1. **Check logs**:
   ```bash
   ssh root@178.156.194.89
   cd /opt/hunter-irrigation
   docker compose logs -f
   ```

2. **Run diagnostics**:
   ```bash
   bash infra/diagnose-500-errors.sh
   ```

3. **Verify environment variables**:
   ```bash
   cat .env | grep NEXT_PUBLIC_VENDURE_API_URL
   cat apps/storefront/.env | grep NEXT_PUBLIC_VENDURE_API_URL
   # Both should show: https://hunterirrigationsupply.com
   ```

4. **Check if storefront was rebuilt**:
   ```bash
   docker compose logs storefront | grep -i "compiled\|ready"
   # Should show recent build/start messages
   ```

### Storefront still using old API URL?

The storefront must be **rebuilt** after changing `NEXT_PUBLIC_` environment variables because they're bundled at build time:

```bash
docker compose build storefront
docker compose restart storefront
```

### Database connection errors?

Check database is running and credentials are correct:

```bash
docker compose ps postgres
docker compose exec postgres pg_isready -U vendure
docker compose exec vendure-api env | grep DB_
```

## Need More Help?

See `FIX_500_ERRORS.md` for detailed troubleshooting guide.




