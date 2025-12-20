# Fixing 500 Internal Server Errors

## Root Causes Identified

### 1. **Storefront API URL Configuration (CRITICAL)**
**Problem**: The storefront was configured with `NEXT_PUBLIC_VENDURE_API_URL: http://vendure-api:3000` in `docker-compose.yml`.

**Why this causes 500 errors**:
- `NEXT_PUBLIC_` environment variables are bundled into client-side JavaScript
- Browsers cannot resolve Docker internal service names like `vendure-api`
- This causes the storefront to fail when trying to make API requests

**Fix Applied**: Changed to use public URL: `${NEXT_PUBLIC_VENDURE_API_URL:-https://hunterirrigationsupply.com}`

### 2. **Database Connection Issues**
**Possible causes**:
- Missing or incorrect database credentials
- Database container not running
- Network connectivity issues between containers

### 3. **Missing Environment Variables**
**Common missing variables**:
- `DB_PASSWORD` - Required for database connection
- `COOKIE_SECRET` - Required for session management
- `NEXT_PUBLIC_VENDURE_API_URL` - Required for storefront API calls

## Files Changed

1. **`docker-compose.yml`**
   - Fixed `NEXT_PUBLIC_VENDURE_API_URL` to use public URL instead of Docker service name
   - Added comment explaining why public URL is needed

2. **`apps/api/src/index.ts`**
   - Enhanced error handling with helpful diagnostic messages
   - Added specific error messages for database connection issues
   - Improved logging on startup

3. **New diagnostic script**: `infra/diagnose-500-errors.sh`
   - Comprehensive diagnostics for all services
   - Tests database connectivity
   - Checks environment variables
   - Tests API endpoints
   - Provides actionable recommendations

4. **New fix script**: `infra/fix-500-errors.sh`
   - Automated fix process
   - Validates environment variables
   - Rebuilds containers
   - Restarts services
   - Runs migrations
   - Verifies deployment

## How to Fix on Production Server

### Option 1: Run the Automated Fix Script

```bash
ssh root@your-server-ip
cd /opt/hunter-irrigation
git pull origin main
bash infra/fix-500-errors.sh
```

### Option 2: Manual Fix

1. **Update environment variables**:
   ```bash
   # Edit root .env
   nano .env
   # Set NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
   
   # Edit apps/storefront/.env
   nano apps/storefront/.env
   # Set NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
   ```

2. **Rebuild and restart**:
   ```bash
   docker compose build storefront
   docker compose restart storefront
   ```

3. **Verify**:
   ```bash
   docker compose logs storefront --tail 50
   curl -I http://localhost:3001
   ```

### Option 3: Run Diagnostics First

```bash
ssh root@your-server-ip
cd /opt/hunter-irrigation
git pull origin main
bash infra/diagnose-500-errors.sh
```

This will identify the specific issue, then you can apply targeted fixes.

## Testing After Fix

1. **Test Admin Panel**:
   ```bash
   curl -I https://hunterirrigationsupply.com/admin
   # Should return 200 or 302 (redirect to login)
   ```

2. **Test Storefront**:
   ```bash
   curl -I https://hunterirrigationsupply.com
   # Should return 200
   ```

3. **Test API Endpoints**:
   ```bash
   curl -I https://hunterirrigationsupply.com/admin-api
   curl -I https://hunterirrigationsupply.com/shop-api
   # Should return 200, 400, or 401 (not 500)
   ```

4. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests
   - Verify API requests go to correct URL

## Common Issues and Solutions

### Issue: Storefront still shows 500 errors
**Solution**: 
- Verify `NEXT_PUBLIC_VENDURE_API_URL` is set to public URL in `.env`
- Rebuild storefront: `docker compose build storefront && docker compose restart storefront`
- Clear browser cache

### Issue: Admin panel shows 500 errors
**Solution**:
- Check database connection: `docker compose exec postgres pg_isready`
- Verify DB credentials in `apps/api/.env`
- Check API logs: `docker compose logs vendure-api --tail 100`
- Run migrations: `docker compose exec vendure-api pnpm run migration:run`

### Issue: API endpoints return 500
**Solution**:
- Check database is running: `docker compose ps postgres`
- Verify environment variables: `docker compose exec vendure-api env | grep DB_`
- Check API logs for specific error messages
- Restart API: `docker compose restart vendure-api`

## Prevention

1. **Always use public URLs for `NEXT_PUBLIC_` variables**
   - These are bundled into client-side code
   - Browsers cannot access Docker internal networks

2. **Set environment variables before building**
   - Rebuild containers after changing environment variables
   - Use `.env` files for configuration

3. **Monitor logs regularly**
   ```bash
   docker compose logs -f
   ```

4. **Run diagnostics after deployment**
   ```bash
   bash infra/diagnose-500-errors.sh
   ```

## Rollback

If fixes cause issues, rollback to previous version:

```bash
cd /opt/hunter-irrigation
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
docker compose build
docker compose restart
```

## Support

If issues persist:
1. Run diagnostics: `bash infra/diagnose-500-errors.sh`
2. Check logs: `docker compose logs -f`
3. Verify all environment variables are set correctly
4. Check database and Redis are running and accessible




