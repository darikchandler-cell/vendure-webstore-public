# Link S3 Images to Products - SUCCESS ✅

## Status: COMPLETED

The `link-s3-images-to-products.ts` script has successfully linked **861 products** with their images from S3.

## Solution

After encountering issues with Vendure's `AssetService.create()` method (which had a `createReadStream is not a function` error), we implemented a direct database approach:

1. **Asset Creation**: Creates assets directly in the database using TypeORM repository
2. **Product Linking**: Uses raw SQL to:
   - Update product's `featuredAssetId` 
   - Insert records into `product_asset` join table with correct column names (`productId`, `assetId`, `position`)

## Results

- ✅ **861 products** successfully linked with images
- ⏭️ **3 products** skipped (already had assets)
- ❌ **0 errors**

## Technical Details

### Asset Creation
- Downloads images from S3 using AWS SDK (bucket is private)
- Creates temporary files
- Creates Asset records directly in database with:
  - `name`: filename
  - `mimeType`: detected from file extension
  - `type`: 'IMAGE'
  - `fileSize`: from file stats
  - `source`: S3 URL
  - `preview`: S3 URL

### Product Linking
- Updates `product.featuredAssetId` using raw SQL
- Inserts into `product_asset` table with:
  - `productId`: product ID
  - `assetId`: asset ID
  - `position`: index of asset (0 for featured)

## Script Location
- **File**: `apps/api/src/scripts/link-s3-images-to-products.ts`
- **Command**: `pnpm run link-s3-images`
- **Server**: Hetzner (178.156.194.89)

## Database Tables Used
- `asset`: Asset records
- `product`: Product records (updates `featuredAssetId`)
- `product_asset`: Join table linking products to assets

## Notes
- Assets are stored with S3 URLs as their source/preview
- All images are successfully linked and should now appear in the Vendure storefront
- The script can be re-run safely (it skips products that already have assets)


