# Automated WooCommerce Import Guide

## Overview

This guide explains how to automatically run the WooCommerce product import using either SSH or the Vendure Admin API.

## Method 1: Direct Server Execution (Recommended)

The import script is designed to run directly on the Hetzner server where the database is accessible.

### Quick Start

**Via Hetzner Console (Easiest):**

1. Go to: https://console.hetzner.cloud/
2. Select: **diamond-street-services**
3. Click: **Console** tab
4. Copy and paste:

```bash
cd /opt/hunter-irrigation/apps/api
test -f /opt/hunter-irrigation/import-hunter.csv && pnpm run import-woocommerce -- --limit=10 || echo "CSV file not found - upload it first"
```

### Full Import

After testing with 10 products, run the full import:

```bash
cd /opt/hunter-irrigation/apps/api
pnpm run import-woocommerce
```

## Method 2: API-Based Import (Remote)

The API-based import uses the Vendure Admin API to create products remotely.

### Setup

1. **Install dependencies:**
   ```bash
   cd apps/api
   pnpm install
   ```

2. **Set environment variables:**
   ```bash
   export VENDURE_API_URL="https://hunterirrigationsupply.com"
   export ADMIN_USERNAME="superadmin"
   export ADMIN_PASSWORD="your-admin-password"
   ```

3. **Run import:**
   ```bash
   pnpm ts-node -r tsconfig-paths/register src/scripts/woocommerce-import/automated-import.ts -- --limit=10
   ```

### API Import Script

The script (`apps/api/src/scripts/woocommerce-import/automated-import.ts`) will:
- Login to Vendure Admin API
- Parse the CSV file
- Transform products with SEO optimizations
- Create products via GraphQL mutations
- Handle errors gracefully

**Note:** API-based import has limitations:
- Images must be uploaded separately (S3 upload happens on server)
- Some complex operations may require direct database access
- Slower than direct server execution

## Method 3: SSH Automation

If you have SSH access configured:

```bash
# Upload CSV
scp import-hunter.csv root@178.156.194.89:/opt/hunter-irrigation/

# Run import
ssh root@178.156.194.89 "cd /opt/hunter-irrigation/apps/api && pnpm run import-woocommerce -- --limit=10"
```

## Method 4: Hetzner CLI

If Hetzner CLI is configured:

```bash
hcloud server ssh diamond-street-services "cd /opt/hunter-irrigation/apps/api && pnpm run import-woocommerce -- --limit=10"
```

## Import Options

All methods support these options:

```bash
# Test with limited products
--limit=10

# Dry run (no changes)
--dry-run

# Skip image processing
--skip-images

# Custom CSV path
--csv-path=/path/to/custom.csv
```

## What Gets Imported

✅ **887 products** from CSV
✅ **SEO optimizations** (titles, meta descriptions, keywords)
✅ **Images** uploaded to S3 (us-west-2, hunter-irrigation-supply)
✅ **AEO fields** (useCase, applicationCategory, audience, compatibility)
✅ **Price adjustments** (+5%, rounded)
✅ **Brands** (Hunter Irrigation, FX Luminaire)
✅ **Collections** from category hierarchy
✅ **Multi-channel** (US and CA with different pricing)

## Troubleshooting

### CSV File Not Found
```bash
# Check if file exists on server
ls -lh /opt/hunter-irrigation/import-hunter.csv

# Upload if needed
scp import-hunter.csv root@178.156.194.89:/opt/hunter-irrigation/
```

### API Login Fails
- Verify admin credentials
- Check API URL is correct
- Ensure API is accessible (not blocked by firewall)

### Database Connection Issues
- Import must run on server (database is localhost-only)
- Check database is running: `docker compose ps postgres`

### Dependencies Missing
```bash
cd /opt/hunter-irrigation/apps/api
pnpm install
```

## Recommended Approach

**For production:** Use **Method 1 (Hetzner Console)** - it's the most reliable and has full access to all features including S3 uploads.

**For development/testing:** Use **Method 2 (API)** - allows remote execution but with some limitations.

## Next Steps

After import:
1. Verify products in admin panel
2. Check images are displaying from S3
3. Test SEO metadata on product pages
4. Verify channel pricing (US vs CA)
5. Check collections are correct


