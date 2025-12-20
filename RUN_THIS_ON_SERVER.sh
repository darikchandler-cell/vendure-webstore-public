#!/bin/bash
# Copy and paste this entire script on your Hetzner server console
# Go to: https://console.hetzner.cloud/ → diamond-street-services → Console

set -e

echo "🔧 Fixing All Issues"
echo "===================="
echo ""

PROJECT_DIR="/opt/hunter-irrigation"
VENDURE_USER="vendure"

# Fix 1: Start storefront service
echo "1. Starting storefront service..."
systemctl start vendure-storefront || echo "⚠️  Failed to start (check logs)"
systemctl enable vendure-storefront
sleep 3

echo ""
echo "2. Checking storefront status..."
if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is running"
else
  echo "❌ Storefront failed to start"
  echo ""
  echo "--- Storefront Logs ---"
  journalctl -u vendure-storefront -n 30 --no-pager
  echo ""
  echo "Common issues:"
  echo "  - Missing .env file"
  echo "  - Build not completed"
  echo "  - Port 3001 in use"
fi

# Fix 2: Check and create superadmin
echo ""
echo "3. Checking for superadmin user..."
ADMIN_COUNT=$(sudo -u postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM \"user\" WHERE identifier LIKE '%admin%';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_COUNT" -eq "0" ] || [ -z "$ADMIN_COUNT" ]; then
  echo "⚠️  Superadmin user missing, creating..."
  if [ -d "$PROJECT_DIR/apps/api" ]; then
    cd "$PROJECT_DIR/apps/api"
    sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10
    echo "✅ Superadmin creation attempted"
  else
    echo "❌ Project directory not found: $PROJECT_DIR"
  fi
else
  echo "✅ Superadmin user exists (count: $ADMIN_COUNT)"
fi

# Fix 3: Verify all services
echo ""
echo "4. Service Status:"
echo "=================="
systemctl is-active vendure-api && echo "✅ API: Running" || echo "❌ API: Not running"
systemctl is-active vendure-worker && echo "✅ Worker: Running" || echo "❌ Worker: Not running"
systemctl is-active vendure-storefront && echo "✅ Storefront: Running" || echo "❌ Storefront: Not running"
systemctl is-active caddy && echo "✅ Caddy: Running" || echo "❌ Caddy: Not running"

# Fix 4: Test local endpoints
echo ""
echo "5. Testing Local Endpoints:"
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

# Fix 5: Check storefront build
echo ""
echo "6. Checking Storefront Build:"
echo "============================="
if [ -d "$PROJECT_DIR/apps/storefront/.next" ]; then
  echo "✅ Storefront build exists"
else
  echo "❌ Storefront build missing"
  echo "   Rebuilding storefront..."
  if [ -d "$PROJECT_DIR/apps/storefront" ]; then
    cd "$PROJECT_DIR/apps/storefront"
    sudo -u vendure bash -c 'pnpm install && pnpm build' || echo "⚠️  Build failed - check logs"
  fi
fi

# Summary
echo ""
echo "=============================="
echo "✅ Fixes Applied"
echo "=============================="
echo ""
echo "Test your sites:"
echo "  curl -I https://hunterirrigationsupply.com"
echo "  curl -I https://hunterirrigationsupply.com/admin"
echo ""

