#!/bin/bash
# Copy and paste this on your Hetzner server console
# Go to: https://console.hetzner.cloud/ → diamond-street-services → Console

echo "🚀 Starting Storefront Service"
echo "=============================="
echo ""

# Start the service
systemctl start vendure-storefront
systemctl enable vendure-storefront

# Wait a moment
sleep 3

# Check status
echo "Service Status:"
systemctl status vendure-storefront --no-pager -l | head -15

echo ""
echo "Testing local endpoint..."
curl -s -o /dev/null -w "Local Storefront: HTTP %{http_code}\n" http://localhost:3001

echo ""
if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING"
  echo ""
  echo "Test your site:"
  echo "  curl -I https://hunterirrigationsupply.com"
else
  echo "❌ Storefront failed to start"
  echo ""
  echo "Recent logs:"
  journalctl -u vendure-storefront -n 20 --no-pager
fi

