# 🚨 DO THIS NOW - Fix All Issues

## Copy This Entire Script to Hetzner Console

1. **Go to:** https://console.hetzner.cloud/
2. **Login** → Open **diamond-street-services**
3. **Click:** **Console** tab
4. **Paste** the entire script below:

---

```bash
#!/bin/bash
# Complete fix for all launch blockers

PROJECT_DIR="/opt/hunter-irrigation"
VENDURE_USER="vendure"

echo "🔧 Fixing All Launch Blockers"
echo "=============================="
echo ""

# Fix 1: Start storefront (CRITICAL - fixes both URLs)
echo "1. Starting Storefront Service..."
systemctl start vendure-storefront
systemctl enable vendure-storefront
sleep 5

if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING"
  systemctl status vendure-storefront --no-pager -l | head -10
else
  echo "❌ Storefront failed to start"
  echo "Checking logs..."
  journalctl -u vendure-storefront -n 30 --no-pager
  
  # Try to rebuild if build missing
  if [ ! -d "$PROJECT_DIR/apps/storefront/.next" ]; then
    echo "Rebuilding storefront..."
    cd "$PROJECT_DIR/apps/storefront"
    sudo -u vendure bash -c 'pnpm install && pnpm build' || echo "⚠️  Build failed"
    systemctl restart vendure-storefront
    sleep 5
  fi
fi

# Fix 2: Create superadmin
echo ""
echo "2. Creating Superadmin User..."
ADMIN_COUNT=$(sudo -u postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM \"user\" WHERE identifier LIKE '%admin%';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_COUNT" = "0" ]; then
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

# Fix 5: Test external URLs
echo ""
echo "5. Testing External URLs:"
US_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigationsupply.com 2>/dev/null || echo "000")
CA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigation.ca 2>/dev/null || echo "000")

if [ "$US_STATUS" = "200" ]; then
  echo "✅ US Storefront: OK ($US_STATUS)"
else
  echo "❌ US Storefront: $US_STATUS"
fi

if [ "$CA_STATUS" = "200" ]; then
  echo "✅ CA Storefront: OK ($CA_STATUS)"
else
  echo "❌ CA Storefront: $CA_STATUS"
fi

echo ""
echo "=============================="
echo "✅ Fix Complete"
echo "=============================="
```

---

## What This Does

1. ✅ **Starts storefront service** - Fixes 502 errors on both URLs
2. ✅ **Creates superadmin user** - Fixes login issues
3. ✅ **Verifies all services** - Confirms everything is running
4. ✅ **Tests endpoints** - Verifies local and external access
5. ✅ **Shows status** - Reports what's working and what's not

## After Running

Test your sites:
```bash
curl -I https://hunterirrigationsupply.com
curl -I https://hunterirrigation.ca
```

Both should return **HTTP 200** (not 502).

