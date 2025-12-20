# Fix Admin Login 500 Error

## Problem

The admin login page returns **500 Internal Server Error** when trying to authenticate. The error occurs because the database is missing a required column that Vendure v2.2.0 needs.

## Root Cause

Vendure v2.2.0 added the `authenticationStrategy` column to the `session` table. When you upgraded to v2.2.0, the database schema wasn't updated, so any login attempt fails with:

```
column "authenticationStrategy" of relation "session" does not exist
```

## Solution

Run the database migration that adds the missing column.

### Quick Fix (Recommended)

SSH to your production server and run:

```bash
ssh root@your-server-ip
cd /opt/hunter-irrigation
bash infra/fix-admin-login-500.sh
```

This script will:
1. ✅ Pull latest code with the migration
2. ✅ Verify the migration file exists
3. ✅ Run the migration to add the `authenticationStrategy` column
4. ✅ Restart the API container
5. ✅ Verify the fix worked

### Manual Fix

If the script doesn't work, run these commands manually:

```bash
# 1. SSH to server
ssh root@your-server-ip
cd /opt/hunter-irrigation

# 2. Pull latest code
git pull origin main

# 3. Run the migration
docker compose exec vendure-api pnpm run migration:run

# 4. Restart API
docker compose restart vendure-api

# 5. Wait for startup
sleep 15

# 6. Verify
curl -I http://localhost:3000/admin-api
```

## Verify the Fix

After running the migration:

1. **Check the migration was applied**:
   ```bash
   docker compose exec postgres psql -U vendure -d vendure -c '\d session'
   ```
   You should see `authenticationStrategy` in the column list.

2. **Test the admin login**:
   - Go to: https://hunterirrigationsupply.com/admin
   - Try logging in with:
     - Email: `admin@hunterirrigationsupply.com`
     - Password: `superadmin` (or your configured password)
   - Should no longer get 500 errors

3. **Check API logs**:
   ```bash
   docker compose logs vendure-api --tail 50
   ```
   Should not show database column errors.

## Default Admin Credentials

⚠️ **Change these after first login!**

- **Email**: `admin@hunterirrigationsupply.com`
- **Password**: `superadmin` (or check your `.env` for `SUPERADMIN_PASSWORD`)

## Troubleshooting

### Migration fails with "already exists" error

The migration may have already been run. Check if the column exists:

```bash
docker compose exec postgres psql -U vendure -d vendure -c "SELECT column_name FROM information_schema.columns WHERE table_name='session' AND column_name='authenticationStrategy';"
```

If it returns a row, the migration already ran. The issue might be something else.

### Still getting 500 errors after migration

1. **Check API logs for specific errors**:
   ```bash
   docker compose logs vendure-api --tail 100 | grep -i error
   ```

2. **Verify database connection**:
   ```bash
   docker compose exec postgres pg_isready -U vendure
   ```

3. **Check environment variables**:
   ```bash
   docker compose exec vendure-api env | grep -E "DB_|COOKIE_SECRET"
   ```

4. **Restart all services**:
   ```bash
   docker compose restart
   ```

### Migration script not found

If `infra/fix-admin-login-500.sh` doesn't exist, you can run the migration directly:

```bash
docker compose exec vendure-api pnpm run migration:run
```

## What the Migration Does

The migration (`1732782000000-add-auth-strategy-column.ts`) does the following:

1. Adds the `authenticationStrategy` column to the `session` table
2. Sets default value `'native'` for existing rows
3. Makes the column NOT NULL (required)

This is safe to run multiple times - it uses `IF NOT EXISTS` to avoid errors if the column already exists.

## Prevention

To avoid this issue in the future:

1. **Always run migrations after upgrading Vendure**:
   ```bash
   docker compose exec vendure-api pnpm run migration:run
   ```

2. **Check for pending migrations before deployment**:
   ```bash
   docker compose exec vendure-api pnpm run migration:run
   ```

3. **Monitor API logs after upgrades**:
   ```bash
   docker compose logs -f vendure-api
   ```

## Related Files

- Migration: `apps/api/migrations/1732782000000-add-auth-strategy-column.ts`
- Fix script: `infra/fix-admin-login-500.sh`
- Migration runner: `apps/api/src/migrate.ts`




