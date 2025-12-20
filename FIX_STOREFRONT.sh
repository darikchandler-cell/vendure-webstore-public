#!/bin/bash
# Fix Storefront Service - Run this on your Hetzner server
# Copy and paste this entire script in Hetzner Console

set -e

echo "🔧 Fixing Storefront Service"
echo "============================"
echo ""

PROJECT_DIR="/opt/hunter-irrigation"
VENDURE_USER="vendure"

# Step 1: Check current status
echo "1. Current Storefront Status:"
echo "============================="
if systemctl is-active --quiet vendure-storefront 2>/dev/null; then
  echo "✅ Storefront is already running"
  systemctl status vendure-storefront --no-pager -l | head -5
else
  echo "❌ Storefront is NOT running"
fi

# Step 2: Check if service exists
echo ""
echo "2. Checking Service Configuration:"
echo "=================================="
if systemctl list-unit-files | grep -q vendure-storefront; then
  echo "✅ Service file exists"
else
  echo "❌ Service file not found - may need to create it"
fi

# Step 3: Check logs to see why it failed
echo ""
echo "3. Recent Storefront Logs:"
echo "==========================="
journalctl -u vendure-storefront -n 50 --no-pager || echo "No logs available"

# Step 4: Check if build exists
echo ""
echo "4. Checking Storefront Build:"
echo "============================="
if [ -d "$PROJECT_DIR/apps/storefront/.next" ]; then
  echo "✅ Build directory exists"
  ls -la "$PROJECT_DIR/apps/storefront/.next" | head -5
else
  echo "❌ Build directory missing - needs rebuild"
  echo "   Location: $PROJECT_DIR/apps/storefront/.next"
fi

# Step 5: Check environment variables
echo ""
echo "5. Checking Environment:"
echo "========================"
if [ -f "$PROJECT_DIR/.env" ]; then
  echo "✅ .env file exists"
  
  if grep -q "NEXT_PUBLIC_VENDURE_API_URL" "$PROJECT_DIR/.env"; then
    API_URL=$(grep "^NEXT_PUBLIC_VENDURE_API_URL=" "$PROJECT_DIR/.env" | cut -d'=' -f2)
    echo "✅ NEXT_PUBLIC_VENDURE_API_URL: $API_URL"
  else
    echo "❌ NEXT_PUBLIC_VENDURE_API_URL missing"
  fi
  
  if grep -q "US_CHANNEL_TOKEN" "$PROJECT_DIR/.env"; then
    echo "✅ US_CHANNEL_TOKEN is set"
  else
    echo "❌ US_CHANNEL_TOKEN missing"
  fi
else
  echo "❌ .env file not found at $PROJECT_DIR/.env"
fi

# Step 6: Check port availability
echo ""
echo "6. Checking Port 3001:"
echo "====================="
if netstat -tuln 2>/dev/null | grep -q ":3001 " || ss -tuln 2>/dev/null | grep -q ":3001 "; then
  echo "⚠️  Port 3001 is in use"
  netstat -tuln 2>/dev/null | grep ":3001 " || ss -tuln 2>/dev/null | grep ":3001 "
else
  echo "✅ Port 3001 is available"
fi

# Step 7: Try to start the service
echo ""
echo "7. Starting Storefront Service:"
echo "==============================="
systemctl start vendure-storefront 2>&1 || {
  echo "❌ Failed to start service"
  echo ""
  echo "Checking for common issues..."
  
  # Check if Node.js is available
  if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
  else
    echo "✅ Node.js: $(node --version)"
  fi
  
  # Check if pnpm is available
  if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found"
  else
    echo "✅ pnpm: $(pnpm --version)"
  fi
  
  # Check project directory
  if [ ! -d "$PROJECT_DIR/apps/storefront" ]; then
    echo "❌ Storefront directory not found: $PROJECT_DIR/apps/storefront"
  else
    echo "✅ Storefront directory exists"
  fi
}

sleep 3

# Step 8: Verify it started
echo ""
echo "8. Verifying Service Status:"
echo "============================="
if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is now RUNNING"
  systemctl status vendure-storefront --no-pager -l | head -10
else
  echo "❌ Storefront failed to start"
  echo ""
  echo "Recent error logs:"
  journalctl -u vendure-storefront -n 20 --no-pager
fi

# Step 9: Test local endpoint
echo ""
echo "9. Testing Local Endpoint:"
echo "=========================="
STORE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$STORE_STATUS" = "200" ]; then
  echo "✅ Local storefront responding (HTTP $STORE_STATUS)"
else
  echo "❌ Local storefront not responding (HTTP $STORE_STATUS)"
fi

# Step 10: If build is missing, rebuild
echo ""
if [ ! -d "$PROJECT_DIR/apps/storefront/.next" ]; then
  echo "10. Rebuilding Storefront:"
  echo "=========================="
  if [ -d "$PROJECT_DIR/apps/storefront" ]; then
    cd "$PROJECT_DIR/apps/storefront"
    echo "Installing dependencies..."
    sudo -u vendure bash -c 'pnpm install' || echo "⚠️  Install failed"
    echo "Building..."
    sudo -u vendure bash -c 'pnpm build' || echo "⚠️  Build failed"
    echo "Restarting service..."
    systemctl restart vendure-storefront
    sleep 5
    systemctl status vendure-storefront --no-pager -l | head -10
  fi
fi

# Summary
echo ""
echo "=============================="
echo "✅ Storefront Fix Complete"
echo "=============================="
echo ""
echo "Test your storefront:"
echo "  curl -I https://hunterirrigationsupply.com"
echo "  curl -I https://hunterirrigation.ca"
echo ""
echo "If still 502, check:"
echo "  journalctl -u vendure-storefront -f"
echo "  systemctl status vendure-storefront"
echo ""

