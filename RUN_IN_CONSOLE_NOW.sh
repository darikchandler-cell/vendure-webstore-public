#!/bin/bash
# Run this in Hetzner Console to fix everything

echo "🔧 Fixing All Issues..."
echo "======================="
echo ""

# Fix 1: Start storefront
echo "1. Starting storefront..."
systemctl start vendure-storefront
systemctl enable vendure-storefront
sleep 3

if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING!"
else
  echo "❌ Storefront failed to start"
  echo "Checking logs..."
  journalctl -u vendure-storefront -n 20 --no-pager
fi

# Fix 2: Create superadmin
echo ""
echo "2. Creating superadmin..."
cd /opt/hunter-irrigation/apps/api
sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10

# Fix 3: Verify services
echo ""
echo "3. Service Status:"
echo "=================="
systemctl is-active vendure-api && echo "✅ API" || echo "❌ API"
systemctl is-active vendure-worker && echo "✅ Worker" || echo "❌ Worker"
systemctl is-active vendure-storefront && echo "✅ Storefront" || echo "❌ Storefront"
systemctl is-active caddy && echo "✅ Caddy" || echo "❌ Caddy"

# Fix 4: Test endpoints
echo ""
echo "4. Testing Endpoints:"
echo "====================="
curl -s -o /dev/null -w "Local API: HTTP %{http_code}\n" http://localhost:3000/health
curl -s -o /dev/null -w "Local Storefront: HTTP %{http_code}\n" http://localhost:3001

# Fix 5: Test external
echo ""
echo "5. Testing External URLs:"
echo "========================="
US_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigationsupply.com 2>/dev/null || echo "000")
CA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigation.ca 2>/dev/null || echo "000")

echo "US Storefront: $US_STATUS"
echo "CA Storefront: $CA_STATUS"

echo ""
echo "=============================="
if [ "$US_STATUS" = "200" ] && [ "$CA_STATUS" = "200" ]; then
  echo "🎉 SUCCESS! Both storefronts are working!"
else
  echo "⚠️  Some issues remain - check status above"
fi
echo "=============================="




