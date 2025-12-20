# Fix Issues - Immediate Action

## 🚨 Current Status

Based on API testing:
- ✅ **API Working** - Admin API and Shop API responding (200 OK)
- ❌ **Storefront Down** - Returns 502 Bad Gateway
- ❌ **Admin Login** - Authentication failing (superadmin may be missing)

## 🔧 Quick Fix (Run on Server)

### Option 1: Use Hetzner Console

1. Go to: https://console.hetzner.cloud/
2. Login and open: **diamond-street-services**
3. Click: **Console** tab
4. Copy and paste this entire script:

```bash
cd /opt/hunter-irrigation
bash infra/fix-issues-manual.sh
```

### Option 2: SSH (If Password Works)

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
bash infra/fix-issues-manual.sh
```

### Option 3: Manual Steps

If the script doesn't work, run these commands one by one:

```bash
# 1. Start storefront
systemctl start vendure-storefront
systemctl enable vendure-storefront

# 2. Check status
systemctl status vendure-storefront

# 3. If it failed, check logs
journalctl -u vendure-storefront -n 50

# 4. Create superadmin if missing
cd /opt/hunter-irrigation
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'

# 5. Verify all services
systemctl status vendure-api vendure-worker vendure-storefront caddy
```

## 🔍 What the Fix Does

1. **Starts Storefront Service** - Fixes 502 errors
2. **Checks Service Status** - Verifies all services running
3. **Creates Superadmin** - Fixes login issues
4. **Tests Endpoints** - Verifies local connectivity
5. **Checks Build** - Ensures storefront is built
6. **Verifies Environment** - Checks .env configuration

## ✅ Verify Fix

After running the fix, test:

```bash
# Test storefront (should return 200, not 502)
curl -I https://hunterirrigationsupply.com

# Test admin (should return 200 or 301)
curl -I https://hunterirrigationsupply.com/admin

# Test API (should return 200)
curl -I https://hunterirrigationsupply.com/admin-api
```

## 🐛 If Storefront Still Fails

Check these common issues:

### Issue 1: Build Missing
```bash
cd /opt/hunter-irrigation/apps/storefront
sudo -u vendure bash -c 'pnpm install && pnpm build'
systemctl restart vendure-storefront
```

### Issue 2: Environment Variables Missing
```bash
# Check .env exists
ls -la /opt/hunter-irrigation/.env

# Check required variables
cat /opt/hunter-irrigation/.env | grep NEXT_PUBLIC_VENDURE_API_URL
cat /opt/hunter-irrigation/.env | grep US_CHANNEL_TOKEN

# If missing, create from template
cp /opt/hunter-irrigation/.env.template /opt/hunter-irrigation/.env
nano /opt/hunter-irrigation/.env  # Edit with correct values
```

### Issue 3: Port Already in Use
```bash
# Check what's using port 3001
netstat -tuln | grep 3001
lsof -i :3001

# Kill process if needed
kill -9 <PID>
systemctl restart vendure-storefront
```

### Issue 4: Node.js/pnpm Issues
```bash
# Check versions
node --version  # Should be 20.x
pnpm --version

# Reinstall if needed
corepack enable
corepack prepare pnpm@latest --activate
```

## 📊 Expected Results

After fixes:
- ✅ `systemctl status vendure-storefront` shows "active (running)"
- ✅ `curl http://localhost:3001` returns 200
- ✅ `curl https://hunterirrigationsupply.com` returns 200 (not 502)
- ✅ Admin login works at https://hunterirrigationsupply.com/admin/login

## 📞 Still Having Issues?

1. **Check all logs:**
   ```bash
   journalctl -u vendure-storefront -n 100
   journalctl -u vendure-api -n 100
   journalctl -u caddy -n 100
   ```

2. **Run full diagnosis:**
   ```bash
   cd /opt/hunter-irrigation
   bash infra/diagnose-launch-blockers.sh
   ```

3. **Verify services:**
   ```bash
   systemctl status vendure-api vendure-worker vendure-storefront caddy postgresql redis-server
   ```

