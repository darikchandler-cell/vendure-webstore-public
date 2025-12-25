# Link S3 Images to Products - Status

## Current Status
The `link-s3-images-to-products.ts` script is deployed and running, but encountering an error when creating Vendure assets.

## What's Working ✅
1. **Product Discovery**: Successfully finds all 864 products
2. **Brand Inference**: Correctly infers brands from product names (Hunter Irrigation, FX Luminaire, etc.)
3. **S3 Image Discovery**: Successfully finds matching images in S3 bucket based on SKU and brand
4. **S3 Download**: Successfully downloads images from S3 using AWS SDK (fixes 403 errors)

## Current Issue ❌
**Error**: `TypeError: createReadStream is not a function` at Vendure's `asset.service.ts:293`

This error occurs when trying to create Vendure assets from downloaded S3 images. The error is happening inside Vendure's AssetService, suggesting it's trying to call `createReadStream` on something that doesn't have that method.

## Attempted Solutions
1. ✅ Used exact `createAssetFromFile` function from import script
2. ✅ Tried buffer-first approach (then stream fallback)
3. ✅ Tried stream-first approach (then buffer fallback)
4. ✅ Used AWS SDK to download from S3 (fixes 403 errors)
5. ✅ Ensured files are fully written before use
6. ✅ Used asset handler's downloadImage function (but S3 bucket is private, so 403 errors)

## Next Steps
1. **Check if import script works**: Verify if the import script's asset creation works in this environment
2. **Investigate Vendure version**: Check if there's a compatibility issue with Vendure 2.3.3
3. **Alternative approach**: Consider using Vendure's GraphQL API to create assets instead of the service directly
4. **File format**: Check if Vendure expects a specific file format or wrapper object

## Script Location
- **File**: `apps/api/src/scripts/link-s3-images-to-products.ts`
- **Command**: `pnpm run link-s3-images`
- **Server**: Hetzner (178.156.194.89)

## Environment
- **Database**: localhost:5432 (PostgreSQL in Docker)
- **Vendure Version**: 2.3.3
- **Node Version**: v25.2.1 (on server)
- **S3 Bucket**: hunter-irrigation-supply (us-west-2, private)

## Files Modified
- `apps/api/src/scripts/link-s3-images-to-products.ts` - Main script
- `apps/api/package.json` - Added `link-s3-images` script

