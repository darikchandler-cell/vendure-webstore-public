# Fix Asset Images in Admin - Summary

## Problem
Images are not showing in the Vendure admin UI, even though:
- ✅ 4058 assets have local files stored in `static/assets/`
- ✅ Files exist on disk (verified)
- ✅ Assets are linked to products and variants

## Root Cause
The issue is likely that Vendure's AssetServerPlugin needs the `source` field to contain just the filename (not a full path or URL), and the plugin serves assets from `/assets/{filename}`.

## Current Status
- **Total Assets**: 5469
- **Local Files**: 4058 (files exist on disk)
- **HTTP URLs**: 0 (all fixed or never existed)
- **Asset Directory**: `/opt/hunter-irrigation/apps/api/static/assets`
- **AssetServerPlugin Route**: `/assets`

## Solution
The assets are correctly stored. The issue might be:
1. **AssetServerPlugin Configuration**: Verify it's serving from the correct directory
2. **Preview URL Generation**: Vendure should generate URLs like `/assets/{filename}`
3. **WebP MIME Type**: Ensure webp files are served with `image/webp` MIME type
4. **CORS/Headers**: Check if there are any CORS or security headers blocking images

## Next Steps
1. Test direct asset URL: `http://your-domain/assets/{filename}`
2. Check Vendure admin API response for asset preview URLs
3. Verify AssetServerPlugin is correctly configured
4. Check browser console for any 404 or CORS errors

## Files
- Asset storage: `apps/api/static/assets/`
- Config: `apps/api/src/vendure-config.ts` (line 232-235)
- Scripts:
  - `apps/api/src/scripts/check-asset-storage.ts` - Check asset status
  - `apps/api/src/scripts/fix-asset-storage.ts` - Fix HTTP URLs
  - `apps/api/src/scripts/fix-asset-storage-raw-sql.ts` - Fix using raw SQL


