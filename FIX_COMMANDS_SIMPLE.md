# 🚨 Run These Commands in Hetzner Console

Since SSH isn't working, run these commands directly in Hetzner Console:

## Quick Fix (3 commands):

```bash
systemctl start vendure-storefront
systemctl enable vendure-storefront
cd /opt/hunter-irrigation/apps/api && sudo -u vendure bash -c 'pnpm run seed'
```

## Complete Fix (full script):

Copy the entire contents of `RUN_IN_CONSOLE_NOW.sh` and paste it in Hetzner Console.

## What This Fixes:

1. ✅ **Starts storefront** → Fixes 502 errors
2. ✅ **Enables on boot** → Prevents future issues  
3. ✅ **Creates superadmin** → Fixes login

## After Running:

Test the URLs:
- https://hunterirrigationsupply.com (should be 200, not 502)
- https://hunterirrigation.ca (should be 200, not 502)
- https://hunterirrigationsupply.com/admin (should load login page)




