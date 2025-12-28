# Execute Import Now - Quick Guide

## ⚡ Fastest Way to Run Import

Since I don't have direct SSH access, here's the exact command to run:

### Step 1: Access Hetzner Console

1. Go to: **https://console.hetzner.cloud/**
2. Login to your account
3. Click: **diamond-street-services** server
4. Click: **Console** tab

### Step 2: Copy and Paste This Command

```bash
cd /opt/hunter-irrigation/apps/api && test -f /opt/hunter-irrigation/import-hunter.csv && pnpm run import-woocommerce -- --limit=5 || echo "CSV file not found"
```

### Step 3: Monitor Progress

The script will:
- Parse the CSV
- Process 5 products (test run)
- Show progress for each product
- Display final statistics

### Step 4: Run Full Import

If the test succeeds, run:

```bash
cd /opt/hunter-irrigation/apps/api
pnpm run import-woocommerce
```

This will import all 887 products.

## 📋 What You'll See

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
  ✅ Created product: Hunter Hydrawise HPC-FP Wi-Fi Facepack
  ✅ Assigned to collection: Shop Products > Irrigation > Controllers

...

--- Import Summary ---
Total products processed: 5
Products created: 5
Products updated: 0
Products skipped: 0
Errors: 0
```

## ⚠️ If CSV Not Found

If you see "CSV file not found", upload it first:

```bash
# From your local machine
scp import-hunter.csv root@178.156.194.89:/opt/hunter-irrigation/
```

## ✅ After Import

Check results:
1. Admin panel: https://hunterirrigationsupply.com/admin
2. Products should appear in catalog
3. Images should load from S3
4. Collections should be created

## 🆘 Troubleshooting

**Dependencies missing:**
```bash
cd /opt/hunter-irrigation/apps/api
pnpm install
```

**Database connection error:**
- Check database is running: `docker compose ps postgres`
- Or: `systemctl status postgresql`

**Permission errors:**
- Make sure you're in the correct directory
- Check file permissions: `ls -la /opt/hunter-irrigation/import-hunter.csv`


