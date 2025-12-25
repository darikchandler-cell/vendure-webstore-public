# How to Run WooCommerce Import

## Overview

This document explains how to run the WooCommerce product import script that will:
- Import 887 products from `import-hunter.csv`
- Apply SEO optimizations (titles, meta descriptions, keywords)
- Download and upload images to S3 (us-west-2, hunter-irrigation-supply bucket)
- Create products with AEO fields (useCase, applicationCategory, audience, compatibility)
- Adjust prices (+5%, rounded to nearest cent)
- Create brands (Hunter Irrigation, FX Luminaire)
- Create collections from category hierarchy
- Assign products to US and CA channels

## Method 1: Via Hetzner Console (Recommended - No SSH Required)

### Step 1: Access Hetzner Console
1. Go to: https://console.hetzner.cloud/
2. Login to your account
3. Select: **diamond-street-services** server
4. Click: **Console** tab

### Step 2: Upload CSV File (if not already on server)
```bash
# Check if CSV exists
ls -lh /opt/hunter-irrigation/import-hunter.csv

# If not found, you'll need to upload it via:
# - SCP from your local machine
# - Or copy/paste the content via console
```

### Step 3: Run the Import
Copy and paste this entire script into Hetzner Console:

```bash
cd /opt/hunter-irrigation/apps/api

# Check if CSV exists
if [ ! -f "/opt/hunter-irrigation/import-hunter.csv" ]; then
  echo "❌ CSV file not found at /opt/hunter-irrigation/import-hunter.csv"
  echo "   Please upload the CSV file first"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

# Run import (test with 10 products first)
echo "🚀 Starting import (10 products as test)..."
pnpm run import-woocommerce -- --limit=10

# If successful, import all products:
# pnpm run import-woocommerce
```

### Step 4: Monitor Progress
The script will show:
- Products being processed
- Images being downloaded and uploaded to S3
- Products being created/updated
- Final statistics

## Method 2: Via SSH (If Configured)

### Prerequisites
- SSH key configured and added to server
- CSV file uploaded to server

### Commands
```bash
# Upload CSV file
scp import-hunter.csv root@178.156.194.89:/opt/hunter-irrigation/

# SSH to server
ssh root@178.156.194.89

# Run import
cd /opt/hunter-irrigation/apps/api
pnpm run import-woocommerce -- --limit=10  # Test first
pnpm run import-woocommerce                 # Full import
```

## Method 3: Via Vendure Admin API (Programmatic)

### Using GraphQL API
You can use the Vendure Admin API to create products programmatically:

```bash
# Get admin auth token first
curl -X POST https://hunterirrigationsupply.com/admin-api \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(username: \"superadmin\", password: \"your-password\") { ... on CurrentUser { id } ... on ErrorResult { errorCode message } } }"
  }'

# Then use the token to create products via GraphQL mutations
```

## Method 4: Via Hetzner CLI (If Configured)

```bash
# List servers
hcloud server list

# Execute command on server
hcloud server ssh diamond-street-services "cd /opt/hunter-irrigation/apps/api && pnpm run import-woocommerce -- --limit=10"
```

## Database Credentials

If you need to connect directly to the database:

- **Host:** localhost (on server) or 178.156.194.89
- **Port:** 5432
- **Database:** vendure
- **Username:** vendure
- **Password:** PxJqJtSd604cu5DNtoAV7BvL0GuV8hJ2

## Import Script Options

The import script supports several options:

```bash
# Test with limited products
pnpm run import-woocommerce -- --limit=10

# Dry run (no actual changes)
pnpm run import-woocommerce -- --dry-run

# Skip image processing
pnpm run import-woocommerce -- --skip-images

# Custom CSV path
pnpm run import-woocommerce -- --csv-path=/path/to/custom.csv

# Full import (all products)
pnpm run import-woocommerce
```

## What Gets Imported

### Product Data
- ✅ SKU, Name, Description
- ✅ Prices (adjusted +5%, rounded)
- ✅ Stock levels
- ✅ Dimensions (weight, length, width, height)
- ✅ UPC/GTIN codes
- ✅ Categories and tags
- ✅ Brand associations

### SEO Enhancements
- ✅ Optimized titles (Brand + Part Number + Type)
- ✅ Meta descriptions
- ✅ Keywords extraction
- ✅ Clean HTML to Markdown conversion
- ✅ Internal linking

### AEO (Answer Engine Optimization)
- ✅ Use cases
- ✅ Application categories
- ✅ Target audience
- ✅ Compatibility information
- ✅ Manufacturer URLs

### Images
- ✅ Downloads from original URLs
- ✅ Uploads to S3 (us-west-2)
- ✅ Organized by brand and SKU: `products/{brand-slug}/{sku}/{sku}-{index}.{ext}`
- ✅ Creates Vendure assets from S3 URLs

### Collections & Brands
- ✅ Creates collection hierarchy from categories
- ✅ Creates/finds brands (Hunter Irrigation, FX Luminaire)
- ✅ Assigns products to collections

### Multi-Channel Support
- ✅ Assigns products to US and CA channels
- ✅ Sets channel-specific pricing (CAD = USD * 1.20, 20% higher)

## Troubleshooting

### CSV File Not Found
```bash
# Check if file exists
ls -lh /opt/hunter-irrigation/import-hunter.csv

# Upload if needed
scp import-hunter.csv root@178.156.194.89:/opt/hunter-irrigation/
```

### Database Connection Issues
```bash
# Check database is running
docker compose ps postgres
# or
systemctl status postgresql

# Check connection
psql -h localhost -U vendure -d vendure
```

### Dependencies Missing
```bash
cd /opt/hunter-irrigation/apps/api
pnpm install
```

### S3 Upload Issues
- Verify AWS CLI credentials are configured
- Check S3 bucket exists: `hunter-irrigation-supply`
- Verify region: `us-west-2`
- Check bucket permissions

### Import Errors
- Check logs for specific error messages
- Verify CSV format is correct
- Ensure channels exist (US and CA)
- Check tax categories are set up

## Expected Output

When running successfully, you'll see:

```
🚀 Starting WooCommerce to Vendure import...
📁 CSV Path: /opt/hunter-irrigation/import-hunter.csv
🔍 Dry Run: NO
🌐 Languages: en

📖 Parsing CSV file...
✅ Parsed 887 products from CSV

📦 Processing Categories and Brands...
✅ Processed 15 unique category paths into collections
✅ Processed 2 unique brands

🛒 Importing Products...

Processing product: Hunter Hydrawise HPC-FP Wi-Fi Facepack (SKU: HPC-FP)
  ✅ Uploaded 3 images to S3 (us-west-2)
  ✅ Created 3 Vendure assets from S3 URLs
  ✅ Created product: Hunter Hydrawise HPC-FP Wi-Fi Facepack
  ✅ Assigned to collection: Shop Products > Irrigation > Controllers

...

--- Import Summary ---
Total products processed: 887
Products created: 887
Products updated: 0
Products skipped: 0
Errors: 0
```

## Next Steps After Import

1. **Verify Products**: Check admin panel to ensure all products imported correctly
2. **Review Images**: Verify images are displaying correctly from S3
3. **Test SEO**: Check product pages for proper meta tags and structured data
4. **Test Channels**: Verify US and CA pricing is correct
5. **Check Collections**: Ensure products are in correct collections
6. **Monitor Performance**: Check site performance with new products

## Support

If you encounter issues:
1. Check the error messages in the console output
2. Review the troubleshooting section above
3. Check server logs: `docker compose logs vendure-api`
4. Verify database connectivity
5. Check S3 bucket access and permissions

