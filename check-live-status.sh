#!/bin/bash
# Quick Status Check for Live Store

echo "🌐 Checking Live Status of Hunter Irrigation Supply"
echo "=================================================="
echo ""

# Check main storefront
echo "1. Storefront (https://hunterirrigationsupply.com):"
STORE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigationsupply.com)
if [ "$STORE_CODE" = "200" ]; then
    echo "   ✅ LIVE - HTTP $STORE_CODE"
else
    echo "   ❌ NOT LIVE - HTTP $STORE_CODE"
fi

# Check admin panel
echo ""
echo "2. Admin Panel (https://hunterirrigationsupply.com/admin):"
ADMIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://hunterirrigationsupply.com/admin)
if [ "$ADMIN_CODE" = "200" ]; then
    echo "   ✅ LIVE - HTTP $ADMIN_CODE"
else
    echo "   ⚠️  Status: HTTP $ADMIN_CODE"
fi

# Check GraphQL API
echo ""
echo "3. GraphQL API (https://hunterirrigationsupply.com/shop-api):"
API_RESPONSE=$(curl -s -X POST https://hunterirrigationsupply.com/shop-api \
  -H "Content-Type: application/json" \
  -H "vendure-token: us-channel-token" \
  -d '{"query":"{ products(options: {take: 1}) { totalItems } }"}')
PRODUCT_COUNT=$(echo "$API_RESPONSE" | grep -o '"totalItems":[0-9]*' | grep -o '[0-9]*')

if [ -n "$PRODUCT_COUNT" ]; then
    echo "   ✅ LIVE - $PRODUCT_COUNT products available"
else
    echo "   ❌ API not responding correctly"
fi

# Summary
echo ""
echo "=================================================="
if [ "$STORE_CODE" = "200" ] && [ -n "$PRODUCT_COUNT" ]; then
    echo "✅ STORE IS LIVE AND OPERATIONAL"
    echo ""
    echo "📊 Quick Stats:"
    echo "   - Storefront: ✅ Accessible"
    echo "   - Products: ✅ $PRODUCT_COUNT products"
    echo "   - Admin: $([ "$ADMIN_CODE" = "200" ] && echo "✅" || echo "⚠️") Accessible"
    echo ""
    echo "🔗 Links:"
    echo "   Store: https://hunterirrigationsupply.com"
    echo "   Admin: https://hunterirrigationsupply.com/admin"
else
    echo "⚠️  SOME SERVICES MAY NOT BE FULLY OPERATIONAL"
fi
echo ""

