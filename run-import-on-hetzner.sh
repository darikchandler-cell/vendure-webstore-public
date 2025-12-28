#!/bin/bash
# Script to run the WooCommerce import on Hetzner server
# Copy this file to the server and run it there

set -e

cd /opt/hunter-irrigation/apps/api

echo "🚀 Starting WooCommerce import on Hetzner server..."
echo "📁 CSV Path: /opt/hunter-irrigation/import-hunter.csv"
echo ""

# Check if CSV file exists
if [ ! -f "/opt/hunter-irrigation/import-hunter.csv" ]; then
  echo "❌ CSV file not found at /opt/hunter-irrigation/import-hunter.csv"
  echo "   Please upload the CSV file first"
  exit 1
fi

# Run the import
echo "📦 Running import (first 10 products as test)..."
pnpm run import-woocommerce -- --limit=10

echo ""
echo "✅ Import complete! Check the output above for results."
echo ""
echo "To import all products, run:"
echo "  cd /opt/hunter-irrigation/apps/api"
echo "  pnpm run import-woocommerce"



