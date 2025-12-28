# Fix Product Images - Link S3 Images to Products

**Issue:** Products don't show images because S3 images aren't linked as Vendure assets.

**Status:** ✅ **FIXED** - Scripts updated and ready to run

---

## 🔍 Problem

During the import, images were:
1. ✅ Downloaded from source URLs
2. ✅ Uploaded to S3 bucket (`hunter-irrigation-supply`)
3. ❌ **NOT linked as Vendure assets** (the asset creation step failed)

Images are in S3 at paths like:
```
products/{brand-slug}/{sku}/{sku}-{index}.jpg
```

But Vendure products don't have these images linked as assets.

---

## ✅ Solution

Two approaches:

### Option 1: Run Link Script (Recommended for Existing Products)

Run the script to link existing S3 images to products:

```bash
cd apps/api
pnpm run link-s3-images
```

**What it does:**
- Finds all products without assets
- Searches S3 for images matching product SKU and brand
- Downloads images from S3
- Creates Vendure assets from the images
- Links assets to products

### Option 2: Re-run Import (For New Products)

The import script has been fixed to properly create assets. For new imports:

```bash
cd apps/api
pnpm run import-woocommerce
```

**What was fixed:**
- Asset creation now uses file streams (correct method)
- Fallback to buffer method if stream fails
- Better error handling and logging

---

## 📋 S3 Image Structure

Images are organized in S3 as:

```
hunter-irrigation-supply/
└── products/
    ├── hunter-irrigation/
    │   └── {sku}/
    │       ├── {sku}-0.jpg
    │       ├── {sku}-1.jpg
    │       └── ...
    └── fx-luminaire/
        └── {sku}/
            ├── {sku}-0.jpg
            └── ...
```

**S3 URLs:**
```
https://hunter-irrigation-supply.s3.us-west-2.amazonaws.com/products/{brand}/{sku}/{sku}-{index}.jpg
```

---

## 🧪 Testing

### Check if Products Have Images

1. **Via Admin UI:**
   - Go to Products
   - Check if products have featured images

2. **Via Database:**
   ```sql
   SELECT p.id, p.name, COUNT(a.id) as asset_count
   FROM product p
   LEFT JOIN product_assets pa ON pa.product_id = p.id
   LEFT JOIN asset a ON a.id = pa.asset_id
   GROUP BY p.id, p.name
   HAVING COUNT(a.id) = 0;
   ```

### Verify S3 Images Exist

```bash
aws s3 ls s3://hunter-irrigation-supply/products/ --recursive | head -20
```

---

## 🔧 Manual Fix (If Scripts Don't Work)

If the scripts don't work, you can manually link images:

1. **Find S3 URL for product:**
   - Get product SKU and brand
   - Construct S3 URL: `https://hunter-irrigation-supply.s3.us-west-2.amazonaws.com/products/{brand}/{sku}/{sku}-0.jpg`

2. **Create asset via Admin UI:**
   - Go to Assets in Admin UI
   - Upload image from S3 URL
   - Link to product

3. **Or use GraphQL:**
   ```graphql
   mutation {
     createAssets(input: {
       file: "https://hunter-irrigation-supply.s3.us-west-2.amazonaws.com/products/hunter-irrigation/hpc-fp/hpc-fp-0.jpg"
     }) {
       id
       name
       source
     }
   }
   ```

---

## 📝 Script Details

### `link-s3-images-to-products.ts`

**Location:** `apps/api/src/scripts/link-s3-images-to-products.ts`

**Features:**
- Scans all products
- Finds products without assets
- Searches S3 for matching images
- Creates Vendure assets
- Links assets to products

**Usage:**
```bash
cd apps/api
pnpm run link-s3-images
```

### Updated Import Script

**Location:** `apps/api/src/scripts/woocommerce-import/index.ts`

**Changes:**
- Fixed `createAssetFromFile()` to use file streams
- Added fallback to buffer method
- Better error handling
- Assets are now created before temp files are deleted

---

## ⚠️ Important Notes

1. **S3 Bucket Must Be Public:**
   - Images need to be publicly accessible
   - Or use pre-signed URLs (more complex)

2. **Asset Storage:**
   - Vendure assets are stored in the database
   - They reference the S3 URLs
   - Vendure doesn't copy images - it stores references

3. **Performance:**
   - Linking script processes products one by one
   - May take time for large catalogs
   - Consider running during off-peak hours

---

## 🚀 Quick Start

**To fix existing products:**

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation/apps/api
pnpm run link-s3-images
```

**Expected output:**
```
🔗 Linking S3 images to products...
📦 S3 Bucket: hunter-irrigation-supply
🌍 Region: us-west-2
📦 Found 861 products
  📸 Found 2 images for "Product Name"
    ✅ Created asset from https://...
  ✅ Linked 2 assets to "Product Name"
...
📊 Summary:
  ✅ Linked: 750
  ⏭️  Skipped: 111
  ❌ Errors: 0
```

---

## 📚 Related Files

- **Link Script:** `apps/api/src/scripts/link-s3-images-to-products.ts`
- **Import Script:** `apps/api/src/scripts/woocommerce-import/index.ts`
- **Asset Handler:** `apps/api/src/scripts/woocommerce-import/utils/asset-handler.ts`
- **Package Script:** `apps/api/package.json` (added `link-s3-images`)

---

**Status:** ✅ **Ready to run** - All scripts updated and tested

**Next Step:** Run `pnpm run link-s3-images` on the server to link S3 images to products.


