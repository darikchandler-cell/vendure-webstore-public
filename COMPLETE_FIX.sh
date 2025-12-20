#!/bin/bash
# COMPLETE SOLUTION - Add SSH key AND fix all issues
# Copy this ENTIRE script to Hetzner Console and run it

set -e

echo "🔑 Adding SSH Key and Fixing All Issues"
echo "========================================"
echo ""

# Step 1: Add SSH key
echo "1. Adding SSH Key..."
echo "==================="
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key"

mkdir -p ~/.ssh
chmod 700 ~/.ssh

if ! grep -q "vendure-fix-key" ~/.ssh/authorized_keys 2>/dev/null; then
  echo "$PUBLIC_KEY" >> ~/.ssh/authorized_keys
  chmod 600 ~/.ssh/authorized_keys
  echo "✅ SSH key added"
else
  echo "✅ SSH key already exists"
fi

# Step 2: Fix Storefront
echo ""
echo "2. Starting Storefront Service..."
echo "=================================="
systemctl start vendure-storefront || {
  echo "⚠️  Failed to start - checking logs..."
  journalctl -u vendure-storefront -n 30 --no-pager
}

systemctl enable vendure-storefront
sleep 5

if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING!"
  systemctl status vendure-storefront --no-pager -l | head -10
else
  echo "❌ Storefront failed to start"
  echo ""
  echo "Attempting fixes..."
  
  # Check build
  if [ ! -d "/opt/hunter-irrigation/apps/storefront/.next" ]; then
    echo "Rebuilding storefront..."
    cd /opt/hunter-irrigation/apps/storefront
    sudo -u vendure bash -c 'pnpm install && pnpm build' 2>&1 | tail -10 || echo "Build failed"
    systemctl restart vendure-storefront
    sleep 5
  fi
  
  # Check logs
  journalctl -u vendure-storefront -n 30 --no-pager
fi

# Step 3: Create Superadmin
echo ""
echo "3. Creating Superadmin User..."
echo "==============================="
ADMIN_COUNT=$(sudo -u postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM \"user\" WHERE identifier LIKE '%admin%';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_COUNT" = "0" ]; then
  echo "Creating superadmin..."
  cd /opt/hunter-irrigation/apps/api
  sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10
  echo "✅ Superadmin creation attempted"
else
  echo "✅ Superadmin already exists (count: $ADMIN_COUNT)"
fi

# Step 4: Verify Services
echo ""
echo "4. Service Status:"
echo "=================="
systemctl is-active vendure-api && echo "✅ API" || echo "❌ API"
systemctl is-active vendure-worker && echo "✅ Worker" || echo "❌ Worker"
systemctl is-active vendure-storefront && echo "✅ Storefront" || echo "❌ Storefront"
systemctl is-active caddy && echo "✅ Caddy" || echo "❌ Caddy"

# Step 5: Test Endpoints
echo ""
echo "5. Testing Endpoints:"
echo "====================="
curl -s -o /dev/null -w "Local API: HTTP %{http_code}\n" http://localhost:3000/health
curl -s -o /dev/null -w "Local Storefront: HTTP %{http_code}\n" http://localhost:3001

# Step 6: Test External
echo ""
echo "6. Testing External URLs:"
echo "========================="
US_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigationsupply.com 2>/dev/null || echo "000")
CA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigation.ca 2>/dev/null || echo "000")

echo "US Storefront: $US_STATUS"
echo "CA Storefront: $CA_STATUS"

# Summary
echo ""
echo "=============================="
echo "✅ COMPLETE"
echo "=============================="
echo ""

if [ "$US_STATUS" = "200" ] && [ "$CA_STATUS" = "200" ]; then
  echo "🎉 SUCCESS! Both storefronts are working!"
else
  echo "⚠️  Some issues remain - check status above"
fi

echo ""
echo "SSH key added - you can now SSH with:"
echo "  ssh -i ~/.ssh/hetzner_vendure root@178.156.194.89"
echo ""

