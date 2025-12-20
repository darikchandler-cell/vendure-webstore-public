# Fix: NULL authenticationStrategy Error

## Problem

The admin login page shows this error:
```
null value in column "authenticationstrategy" of relation "session" violates not-null constraint
```

## Root Cause

The `authenticationStrategy` column exists in the database, but:
1. Some existing session records have NULL values
2. The migration dropped the DEFAULT value, so new sessions may be created without a value
3. The NOT NULL constraint prevents NULL values, causing the error

## Quick Fix

SSH to your production server and run:

```bash
ssh root@your-server-ip
cd /opt/hunter-irrigation
bash infra/apply-auth-strategy-fix-direct.sh
```

This script will:
1. ✅ Update all NULL values to 'native'
2. ✅ Re-add the DEFAULT value for new rows
3. ✅ Ensure NOT NULL constraint is set
4. ✅ Restart the API

## Manual Fix (If Script Doesn't Work)

Run these SQL commands directly:

```bash
docker compose exec -T postgres psql -U vendure -d vendure <<EOF
-- Update all NULL values
UPDATE session 
SET "authenticationStrategy" = 'native' 
WHERE "authenticationStrategy" IS NULL;

-- Set default for new rows
ALTER TABLE session 
ALTER COLUMN "authenticationStrategy" SET DEFAULT 'native';

-- Ensure NOT NULL constraint
ALTER TABLE session 
ALTER COLUMN "authenticationStrategy" SET NOT NULL;
EOF

# Restart API
docker compose restart vendure-api
```

## Verify the Fix

After running the fix:

1. **Check for NULL values** (should return 0):
   ```bash
   docker compose exec postgres psql -U vendure -d vendure -c "SELECT COUNT(*) FROM session WHERE \"authenticationStrategy\" IS NULL;"
   ```

2. **Test login**:
   - Go to: https://hunterirrigationsupply.com/admin
   - Try logging in
   - Should no longer see the NULL constraint error

3. **Check API logs**:
   ```bash
   docker compose logs vendure-api --tail 50
   ```

## Why This Happened

The original migration (`1732782000000-add-auth-strategy-column.ts`) does:
1. Add column with DEFAULT 'native'
2. Update NULL values
3. **Drop the DEFAULT** (line 28)

Dropping the DEFAULT means new sessions created after the migration won't automatically get a value, causing the error.

## Prevention

The fix script re-adds the DEFAULT value so new sessions will automatically get 'native' as the authenticationStrategy.




