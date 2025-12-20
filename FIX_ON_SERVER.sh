#!/bin/bash
# This script should be copied and run directly on the Hetzner server console
# Go to: https://console.hetzner.cloud/ → diamond-street-services → Console

set -e

echo "🔧 Fixing All Launch Blockers"
echo "=============================="
echo ""

PROJECT_DIR="/opt/hunter-irrigation"
VENDURE_USER="vendure"

# Fix 1: Start storefront (CRITICAL)
echo "1. Starting Storefront Service..."
echo "=================================="
systemctl start vendure-storefront || {
  echo "⚠️  Failed to start - checking logs..."
  journalctl -u vendure-storefront -n 30 --no-pager
  exit 1
}

systemctl enable vendure-storefront
sleep 5

if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING"
  systemctl status vendure-storefront --no-pager -l | head -10
else
  echo "❌ Storefront failed to start"
  echo ""
  echo "Checking for issues..."
  
  # Check if build exists
  if [ ! -d "$PROJECT_DIR/apps/storefront/.next" ]; then
    echo "⚠️  Build missing - rebuilding..."
    cd "$PROJECT_DIR/apps/storefront"
    sudo -u vendure bash -c 'pnpm install && pnpm build' || echo "⚠️  Build failed"
    systemctl restart vendure-storefront
    sleep 5
  fi
  
  # Check logs
  journalctl -u vendure-storefront -n 30 --no-pager
fi

# Fix 2: Create superadmin
echo ""
echo "2. Creating Superadmin User..."
echo "=============================="
ADMIN_COUNT=$(sudo -u postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM \"user\" WHERE identifier LIKE '%admin%';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_COUNT" = "0" ] || [ -z "$ADMIN_COUNT" ]; then
  echo "⚠️  Superadmin missing - creating..."
  cd "$PROJECT_DIR/apps/api"
  sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10
  echo "✅ Superadmin creation attempted"
else
  echo "✅ Superadmin already exists (count: $ADMIN_COUNT)"
fi

# Fix 3: Verify all services
echo ""
echo "3. Service Status:"
echo "=================="
systemctl is-active vendure-api && echo "✅ API: Running" || echo "❌ API: Not running"
systemctl is-active vendure-worker && echo "✅ Worker: Running" || echo "❌ Worker: Not running"
systemctl is-active vendure-storefront && echo "✅ Storefront: Running" || echo "❌ Storefront: Not running"
systemctl is-active caddy && echo "✅ Caddy: Running" || echo "❌ Caddy: Not running"

# Fix 4: Test local endpoints
echo ""
echo "4. Testing Local Endpoints:"
echo "==========================="
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
STORE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")

if [ "$API_HEALTH" = "200" ]; then
  echo "✅ API Health: OK ($API_HEALTH)"
else
  echo "❌ API Health: Failed ($API_HEALTH)"
fi

if [ "$STORE_HEALTH" = "200" ]; then
  echo "✅ Storefront: OK ($STORE_HEALTH)"
else
  echo "❌ Storefront: Failed ($STORE_HEALTH)"
fi

# Fix 5: Test external URLs
echo ""
echo "5. Testing External URLs:"
echo "========================="
US_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigationsupply.com 2>/dev/null || echo "000")
CA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigation.ca 2>/dev/null || echo "000")

if [ "$US_STATUS" = "200" ]; then
  echo "✅ US Storefront: OK ($US_STATUS)"
elif [ "$US_STATUS" = "502" ]; then
  echo "❌ US Storefront: 502 Bad Gateway (service not running)"
else
  echo "⚠️  US Storefront: $US_STATUS"
fi

if [ "$CA_STATUS" = "200" ]; then
  echo "✅ CA Storefront: OK ($CA_STATUS)"
elif [ "$CA_STATUS" = "502" ]; then
  echo "❌ CA Storefront: 502 Bad Gateway (service not running)"
else
  echo "⚠️  CA Storefront: $CA_STATUS"
fi

# Summary
echo ""
echo "=============================="
echo "✅ Fix Complete"
echo "=============================="
echo ""
if [ "$STORE_HEALTH" = "200" ] && [ "$US_STATUS" = "200" ]; then
  echo "🎉 SUCCESS! Storefronts are working!"
else
  echo "⚠️  Some issues remain - check logs above"
fi
echo ""

