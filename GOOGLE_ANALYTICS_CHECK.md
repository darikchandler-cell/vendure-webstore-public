# Google Analytics Verification - Final Check

## Summary

**Status**: ⚠️ Code is deployed but container needs restart

The Google Analytics code has been:
- ✅ Added to repository
- ✅ Committed and pushed
- ✅ Copied to server filesystem  
- ✅ Container rebuilt with new code

**However**: The storefront container needs to be running for the code to be active.

## Quick Verification

### 1. Check Container Status
```bash
ssh root@178.156.194.89 "docker ps | grep storefront"
```

Should show: `hunter-irrigation-storefront` with status `Up`

### 2. Check Live Site (Browser - Most Reliable)

**USA Site**: https://hunterirrigationsupply.com
1. Open in browser
2. DevTools (F12) → Network tab
3. Filter: "gtag" or "googletagmanager"
4. Refresh page
5. Should see: `www.googletagmanager.com/gtag/js?id=G-BSL225PG0B`

**Canada Site**: https://hunterirrigation.ca
1. Open in browser
2. DevTools (F12) → Network tab
3. Filter: "gtag" or "googletagmanager"
4. Refresh page
5. Should see: `www.googletagmanager.com/gtag/js?id=G-9LK4JKHQSP`

### 3. Check Google Analytics Real-Time

1. Go to: https://analytics.google.com
2. Select property: `G-BSL225PG0B` (USA) or `G-9LK4JKHQSP` (Canada)
3. Go to: Reports → Real-time
4. Visit the site
5. Should see your visit appear in real-time

## Why Curl Doesn't Show It

Next.js Script components with `strategy="afterInteractive"` load **after** the page becomes interactive. They won't appear in:
- Initial HTML from `curl`
- View page source
- Server-side rendered HTML

They **will** appear in:
- Browser DevTools → Network tab
- Browser DevTools → Elements tab (after page loads)
- Google Analytics Real-Time reports

## Current Implementation

**Next.js Storefront** (`apps/storefront/app/layout.tsx`):
```typescript
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
  strategy="afterInteractive"
/>
```

This loads the script **after** the page is interactive, which is why it doesn't show in curl but will work in browsers.

## Next Steps

1. **Verify container is running:**
   ```bash
   ssh root@178.156.194.89 "docker ps | grep storefront"
   ```

2. **If not running, start it:**
   ```bash
   ssh root@178.156.194.89 "cd /opt/hunter-irrigation && docker-compose up -d storefront"
   ```

3. **Wait 30-60 seconds for Next.js to start**

4. **Test in browser** (most reliable method)

## Expected Results

✅ **Browser DevTools Network Tab**:
- Request to: `www.googletagmanager.com/gtag/js?id=G-BSL225PG0B` (USA)
- Request to: `www.googletagmanager.com/gtag/js?id=G-9LK4JKHQSP` (Canada)

✅ **Google Analytics Real-Time**:
- Your visit should appear within seconds

✅ **Browser Console**:
- No errors related to gtag
- `window.dataLayer` should exist


