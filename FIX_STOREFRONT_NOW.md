# Fix Storefront - Quick Guide

## 🚨 Issue
Storefront returns **502 Bad Gateway** - service is not running.

## 🔧 Quick Fix (3 Commands)

Run these on your Hetzner server:

```bash
# 1. Start the storefront service
systemctl start vendure-storefront

# 2. Enable it to start on boot
systemctl enable vendure-storefront

# 3. Check if it started
systemctl status vendure-storefront
```

## 📋 Complete Fix Script

Copy and paste this entire script in **Hetzner Console**:

1. Go to: https://console.hetzner.cloud/
2. Login → Open **diamond-street-services**
3. Click **Console** tab
4. Paste the contents of `FIX_STOREFRONT.sh`

Or run:
```bash
cd /opt/hunter-irrigation
bash infra/fix-storefront-only.sh
```

## 🔍 If Storefront Won't Start

### Check 1: View Error Logs
```bash
journalctl -u vendure-storefront -n 50
```

### Check 2: Build Missing
```bash
# Check if build exists
ls -la /opt/hunter-irrigation/apps/storefront/.next

# If missing, rebuild:
cd /opt/hunter-irrigation/apps/storefront
sudo -u vendure bash -c 'pnpm install && pnpm build'
systemctl restart vendure-storefront
```

### Check 3: Environment Variables
```bash
# Check .env file
cat /opt/hunter-irrigation/.env | grep NEXT_PUBLIC_VENDURE_API_URL

# Should have:
# NEXT_PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
# NEXT_PUBLIC_US_CHANNEL_TOKEN=...
# NEXT_PUBLIC_CA_CHANNEL_TOKEN=...
```

### Check 4: Port Conflict
```bash
# Check if port 3001 is in use
netstat -tuln | grep 3001

# If something else is using it, kill it:
lsof -i :3001
kill -9 <PID>
systemctl restart vendure-storefront
```

### Check 5: Service File Missing
```bash
# Check if service file exists
ls -la /etc/systemd/system/vendure-storefront.service

# If missing, it needs to be created (run setup script)
```

## ✅ Verify Fix

After starting the service:

```bash
# Test locally
curl -I http://localhost:3001
# Should return: HTTP 200

# Test externally
curl -I https://hunterirrigationsupply.com
# Should return: HTTP 200 (not 502)

curl -I https://hunterirrigation.ca
# Should return: HTTP 200 (not 502)
```

## 🐛 Common Issues & Solutions

### Issue: "Unit vendure-storefront.service not found"
**Solution:** Service file doesn't exist. Run:
```bash
cd /opt/hunter-irrigation
bash infra/setup-hetzner-native.sh
```

### Issue: "Failed to start: Exec format error"
**Solution:** Wrong Node.js version or architecture. Check:
```bash
node --version  # Should be 20.x
uname -m        # Should match Node.js binary
```

### Issue: "Failed to start: No such file or directory"
**Solution:** Build missing or path incorrect. Rebuild:
```bash
cd /opt/hunter-irrigation/apps/storefront
sudo -u vendure bash -c 'pnpm install && pnpm build'
```

### Issue: "Failed to start: EADDRINUSE"
**Solution:** Port 3001 already in use:
```bash
lsof -i :3001
kill -9 <PID>
systemctl restart vendure-storefront
```

## 📊 Expected Service Status

After fix:
```bash
systemctl status vendure-storefront
```

Should show:
- ✅ `Active: active (running)`
- ✅ `Main PID: <number>`
- ✅ No error messages

## 🚀 Quick One-Liner

If you just need to start it:
```bash
systemctl start vendure-storefront && systemctl enable vendure-storefront && systemctl status vendure-storefront
```
