#!/bin/bash
# Check Product Count in Vendure Database
# This script checks how many products are actually in the database vs expected

set -e

echo "🔍 Checking Product Count in Vendure Database"
echo "=============================================="
echo ""

# Expected count from import documentation
EXPECTED_COUNT=861

# Check if we're on the server or need to use docker-compose
if [ -f "docker-compose.yml" ]; then
    echo "📊 Querying database via docker-compose..."
    echo ""
    
    # Get product count
    PRODUCT_COUNT=$(docker-compose exec -T postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM product;" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Get variant count
    VARIANT_COUNT=$(docker-compose exec -T postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM product_variant;" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Get products with translations (active products)
    ACTIVE_COUNT=$(docker-compose exec -T postgres psql -U vendure -d vendure -t -c "SELECT COUNT(DISTINCT \"baseId\") FROM product_translation WHERE \"languageCode\" = 'en';" 2>/dev/null | tr -d ' ' || echo "0")
    
elif docker ps | grep -q "hunter-irrigation-postgres"; then
    echo "📊 Querying database via docker exec..."
    echo ""
    
    # Get product count
    PRODUCT_COUNT=$(docker exec hunter-irrigation-postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM product;" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Get variant count
    VARIANT_COUNT=$(docker exec hunter-irrigation-postgres psql -U vendure -d vendure -t -c "SELECT COUNT(*) FROM product_variant;" 2>/dev/null | tr -d ' ' || echo "0")
    
    # Get products with translations (active products)
    ACTIVE_COUNT=$(docker exec hunter-irrigation-postgres psql -U vendure -d vendure -t -c "SELECT COUNT(DISTINCT \"baseId\") FROM product_translation WHERE \"languageCode\" = 'en';" 2>/dev/null | tr -d ' ' || echo "0")
    
else
    echo "❌ Error: Cannot find docker-compose.yml or running postgres container"
    echo "   Make sure you're in the project directory or docker containers are running"
    exit 1
fi

echo "📈 Product Statistics:"
echo "---------------------"
echo "  Total Products (base):     $PRODUCT_COUNT"
echo "  Active Products (with EN):  $ACTIVE_COUNT"
echo "  Total Variants:             $VARIANT_COUNT"
echo "  Expected Products:          $EXPECTED_COUNT"
echo ""

# Compare counts
if [ "$ACTIVE_COUNT" -ge "$EXPECTED_COUNT" ]; then
    echo "✅ SUCCESS: All products are deployed!"
    echo "   Found $ACTIVE_COUNT products (expected $EXPECTED_COUNT)"
elif [ "$ACTIVE_COUNT" -gt "0" ]; then
    DIFF=$((EXPECTED_COUNT - ACTIVE_COUNT))
    PERCENT=$((ACTIVE_COUNT * 100 / EXPECTED_COUNT))
    echo "⚠️  PARTIAL: Only $ACTIVE_COUNT of $EXPECTED_COUNT products deployed ($PERCENT%)"
    echo "   Missing: $DIFF products"
else
    echo "❌ ERROR: No products found in database!"
    echo "   The import may not have completed or failed."
fi

echo ""
echo "💡 To verify in admin UI:"
echo "   Visit: https://hunterirrigationsupply.com/admin"
echo "   Navigate to: Catalog → Products"
echo ""


