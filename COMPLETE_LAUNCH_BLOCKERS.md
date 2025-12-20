# Complete Launch Blockers - All Issues

## 🚨 Critical Blockers Preventing Launch

### Blocker #1: Storefront Service Not Running
**Status:** ❌ CRITICAL
**Impact:** Both storefronts return 502 Bad Gateway

**Affected URLs:**
- `https://hunterirrigationsupply.com` → 502
- `https://hunterirrigation.ca` → 502

**Fix Required:**
```bash
# On server (Hetzner Console):
systemctl start vendure-storefront
systemctl enable vendure-storefront
systemctl status vendure-storefront
```

**If it fails:**
```bash
# Check logs
journalctl -u vendure-storefront -n 50

# Common issues:
# - Build missing: cd /opt/hunter-irrigation/apps/storefront && sudo -u vendure bash -c 'pnpm build'
# - Port conflict: netstat -tuln | grep 3001
# - Environment missing: cat /opt/hunter-irrigation/.env | grep NEXT_PUBLIC
```

---

### Blocker #2: Admin Login Failing
**Status:** ❌ CRITICAL
**Impact:** Cannot access admin panel

**Error:** `{"errors":[{"message":"","path":["login"]}]}`

**Fix Required:**
```bash
# Create superadmin user
cd /opt/hunter-irrigation
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'
```

**Verify:**
```bash
sudo -u postgres psql -U vendure -d vendure -c "SELECT identifier FROM \"user\" WHERE identifier LIKE '%admin%';"
```

---

## ✅ What's Working

1. **Admin API** - HTTP 200 ✅
2. **Shop API** - HTTP 200 ✅
3. **Admin UI Page** - Loads (HTTP 301 redirect) ✅
4. **SSL/TLS** - Valid certificates ✅
5. **DNS** - Resolving correctly ✅
6. **Caddy** - Routing API requests ✅

---

## 🔧 Complete Fix Script

Run this entire script on your server:

```bash
#!/bin/bash
# Complete fix for all launch blockers

PROJECT_DIR="/opt/hunter-irrigation"
VENDURE_USER="vendure"

echo "🔧 Fixing All Launch Blockers"
echo "=============================="
echo ""

# Fix 1: Start storefront
echo "1. Starting storefront..."
systemctl start vendure-storefront
systemctl enable vendure-storefront
sleep 5

if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront started"
else
  echo "❌ Storefront failed - checking logs..."
  journalctl -u vendure-storefront -n 30 --no-pager
  
  # Try to rebuild if build missing
  if [ ! -d "$PROJECT_DIR/apps/storefront/.next" ]; then
    echo "Rebuilding storefront..."
    cd "$PROJECT_DIR/apps/storefront"
    sudo -u vendure bash -c 'pnpm install && pnpm build'
    systemctl restart vendure-storefront
  fi
fi

# Fix 2: Create superadmin
echo ""
echo "2. Creating superadmin..."
ADMIN_COUNT=$(sudo -u postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM \"user\" WHERE identifier LIKE '%admin%';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_COUNT" -eq "0" ]; then
  cd "$PROJECT_DIR/apps/api"
  sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10
  echo "✅ Superadmin creation attempted"
else
  echo "✅ Superadmin already exists"
fi

# Fix 3: Verify all services
echo ""
echo "3. Service Status:"
systemctl is-active vendure-api && echo "✅ API" || echo "❌ API"
systemctl is-active vendure-worker && echo "✅ Worker" || echo "❌ Worker"
systemctl is-active vendure-storefront && echo "✅ Storefront" || echo "❌ Storefront"
systemctl is-active caddy && echo "✅ Caddy" || echo "❌ Caddy"

# Fix 4: Test endpoints
echo ""
echo "4. Testing Endpoints:"
curl -s -o /dev/null -w "Local API: HTTP %{http_code}\n" http://localhost:3000/health
curl -s -o /dev/null -w "Local Storefront: HTTP %{http_code}\n" http://localhost:3001

echo ""
echo "✅ Fixes Applied"
echo ""
echo "Test your sites:"
echo "  curl -I https://hunterirrigationsupply.com"
echo "  curl -I https://hunterirrigation.ca"
```

---

## 📋 Pre-Launch Checklist

Before launching, ensure:

- [ ] Storefront service running (`systemctl status vendure-storefront`)
- [ ] Both storefronts return 200 (not 502)
- [ ] Admin login works
- [ ] All services running (API, Worker, Storefront, Caddy)
- [ ] Database accessible
- [ ] Environment variables set
- [ ] Channels created (US and CA)
- [ ] Superadmin user exists

---

## 🚀 Launch Readiness

**Current Status:**
- ❌ **NOT READY** - Storefront down (502 errors)
- ❌ **NOT READY** - Admin login failing
- ✅ Infrastructure working (API, database, SSL, DNS)

**To Launch:**
1. Start storefront service
2. Create superadmin user
3. Verify both storefronts load
4. Test admin login
5. Then ready to launch!

---

## 🆘 Emergency Fix

If you need to fix everything right now:

```bash
# Copy and paste this in Hetzner Console:

cd /opt/hunter-irrigation

# Start storefront
systemctl start vendure-storefront && systemctl enable vendure-storefront

# Create superadmin
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'

# Verify
systemctl status vendure-storefront
curl -I https://hunterirrigationsupply.com
```

