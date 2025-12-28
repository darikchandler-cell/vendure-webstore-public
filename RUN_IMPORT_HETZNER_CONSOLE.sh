#!/bin/bash
# Copy this ENTIRE script to Hetzner Console and run it
# Go to: https://console.hetzner.cloud/ → diamond-street-services → Console

set -e

echo "🚀 Starting WooCommerce Import"
echo "================================"
echo ""

PROJECT_DIR="/opt/hunter-irrigation"
CSV_FILE="$PROJECT_DIR/import-hunter.csv"
API_DIR="$PROJECT_DIR/apps/api"

# Check if CSV exists
if [ ! -f "$CSV_FILE" ]; then
  echo "❌ CSV file not found at $CSV_FILE"
  echo ""
  echo "Please upload the CSV file first:"
  echo "  scp import-hunter.csv root@178.156.194.89:$PROJECT_DIR/"
  exit 1
fi

echo "✅ CSV file found: $CSV_FILE"
echo ""

# Navigate to API directory
cd "$API_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
  echo ""
fi

# Run import (test with 5 products first)
echo "📦 Running import (5 products as test)..."
echo ""

pnpm run import-woocommerce -- --limit=5

echo ""
echo "================================"
echo "✅ Test import complete!"
echo ""
echo "If successful, run full import with:"
echo "  cd $API_DIR"
echo "  pnpm run import-woocommerce"
echo ""


