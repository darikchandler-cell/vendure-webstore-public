#!/bin/bash
# Run WooCommerce Import on Hetzner Server
# Copy this entire script to Hetzner Console and run it
# Go to: https://console.hetzner.cloud/ → diamond-street-services → Console

set -e

echo "🚀 Starting WooCommerce Import on Hetzner Server"
echo "================================================"
echo ""

PROJECT_DIR="/opt/hunter-irrigation"
CSV_FILE="/opt/hunter-irrigation/import-hunter.csv"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
  echo "❌ CSV file not found at $CSV_FILE"
  echo "   Please upload import-hunter.csv to the server first"
  exit 1
fi

# Navigate to API directory
cd "$PROJECT_DIR/apps/api"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# Run the import (test with 10 products first)
echo ""
echo "📦 Running import (first 10 products as test)..."
echo "   CSV: $CSV_FILE"
echo ""

pnpm run import-woocommerce -- --limit=10

echo ""
echo "✅ Import test complete!"
echo ""
echo "To import all products, run:"
echo "  cd $PROJECT_DIR/apps/api"
echo "  pnpm run import-woocommerce"
echo ""

