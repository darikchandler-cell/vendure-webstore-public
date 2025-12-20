# 🚨 URGENT FIX - Run This Now

## SSH Authentication Failed

I cannot SSH directly because password authentication is disabled or the password changed.

## ✅ Solution: Use Hetzner Console

### Step 1: Access Console
1. Go to: **https://console.hetzner.cloud/**
2. Login to your account
3. Click: **diamond-street-services**
4. Click: **Console** tab

### Step 2: Run These Commands

**Quick Fix (3 commands):**
```bash
systemctl start vendure-storefront
systemctl enable vendure-storefront
cd /opt/hunter-irrigation && sudo -u vendure bash -c 'cd apps/api && pnpm run seed'
```

**OR Complete Fix (entire script):**
Copy the entire contents of `FIX_HETZNER_NOW.sh` and paste it in the console.

## What This Fixes

1. ✅ **Starts storefront** → Fixes 502 on both URLs
2. ✅ **Creates superadmin** → Fixes login
3. ✅ **Enables auto-start** → Prevents future issues

## After Running

Test immediately:
```bash
curl -I https://hunterirrigationsupply.com
curl -I https://hunterirrigation.ca
```

Both should return **HTTP 200** (not 502).

## If It Still Fails

The script will show you exactly what's wrong:
- Build missing → Will rebuild automatically
- Environment missing → Will create from template
- Service errors → Will show logs

## Files Ready

- ✅ `FIX_HETZNER_NOW.sh` - Complete fix script (150+ lines)
- ✅ `FIX_NOW.txt` - Same script in text format
- ✅ All diagnostic tools ready

**Just copy and paste to Hetzner Console!**




