# Fix Variant Images in Admin

## Problem
Product variants are not showing images in the Vendure admin UI, even though products have assets.

## Solution
Created a script to ensure all variants inherit the product's featured asset.

## Run the Fix

```bash
cd apps/api
pnpm run fix-variant-images
```

## What the Script Does

1. **Checks Current Status**: Reports how many variants have/don't have featured assets
2. **Finds Products with Assets**: Gets all products that have featured assets
3. **Links Assets to Variants**: For each variant without an asset:
   - Sets `featuredAssetId` on the variant to match the product's featured asset
   - Links the asset via `product_variant_asset` join table
4. **Verifies Results**: Reports final status

## Expected Results

- All variants should have `featuredAssetId` set
- All variants should have entries in `product_variant_asset` join table
- Images should display in the admin UI

## If Images Still Don't Show

1. **Check Asset Preview URLs**: Ensure assets have correct `/assets/{filename}` format
2. **Verify AssetServerPlugin**: Ensure it's serving from `static/assets/`
3. **Check Browser Console**: Look for 404 errors on asset URLs
4. **Restart Vendure**: May need to restart for changes to take effect

## Database Tables

- `product_variant.featuredAssetId` - Direct reference to asset
- `product_variant_asset` - Join table linking variants to assets

