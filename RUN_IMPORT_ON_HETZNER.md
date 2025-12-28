# Run WooCommerce Import on Hetzner Server

## Option 1: Via Hetzner Console (Recommended)

1. **Go to Hetzner Console:**
   - Visit: https://console.hetzner.cloud/
   - Login and select: **diamond-street-services**
   - Click: **Console** tab

2. **Upload CSV file:**
   ```bash
   # First, check if CSV exists
   ls -lh /opt/hunter-irrigation/import-hunter.csv
   
   # If not found, you'll need to upload it via SCP or another method
   ```

3. **Run the import script:**
   Copy and paste this entire script into Hetzner Console:

   ```bash
   cd /opt/hunter-irrigation/apps/api
   
   # Check if CSV exists
   if [ ! -f "/opt/hunter-irrigation/import-hunter.csv" ]; then
     echo "❌ CSV file not found. Please upload it first."
     exit 1
   fi
   
   # Install dependencies if needed
   if [ ! -d "node_modules" ]; then
     pnpm install
   fi
   
   # Run import (test with 10 products)
   pnpm run import-woocommerce -- --limit=10
   ```

4. **If successful, import all products:**
   ```bash
   pnpm run import-woocommerce
   ```

## Option 2: Via SSH (if configured)

If you have SSH access configured:

```bash
# Upload CSV file
scp import-hunter.csv root@178.156.194.89:/opt/hunter-irrigation/

# SSH to server
ssh root@178.156.194.89

# Run import
cd /opt/hunter-irrigation/apps/api
pnpm run import-woocommerce -- --limit=10
```

## Database Credentials (for reference)

- **Host:** localhost (on server) or 178.156.194.89
- **Port:** 5432
- **Database:** vendure
- **Username:** vendure
- **Password:** PxJqJtSd604cu5DNtoAV7BvL0GuV8hJ2

## What the Import Will Do

✅ Parse 887 products from CSV
✅ Apply SEO optimizations (titles, meta descriptions, keywords)
✅ Download images from URLs
✅ Upload images to S3 (us-west-2, hunter-irrigation-supply bucket)
✅ Create products with AEO fields (useCase, applicationCategory, audience, compatibility)
✅ Adjust prices (+5%, rounded to nearest cent)
✅ Create brands (Hunter Irrigation, FX Luminaire)
✅ Create collections from category hierarchy
✅ Assign products to US and CA channels
✅ Set channel-specific pricing


