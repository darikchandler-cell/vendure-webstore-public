# Google Analytics Deployment Status

## Current Status: ⚠️ NOT YET DEPLOYED

**Issue**: Google Analytics code is in the repository and on the server filesystem, but the Docker container needs to be rebuilt and restarted to include the changes.

## What's Done ✅

1. ✅ Code added to `apps/storefront/app/layout.tsx`
2. ✅ Code added to `apps/remix-storefront/app/root.tsx`
3. ✅ Code committed and pushed to GitHub
4. ✅ Code copied to server filesystem
5. ✅ Container rebuilt

## What's Needed 🔄

The storefront container needs to be properly restarted with the new build. The container was rebuilt but may not have started correctly.

## Verification Commands

### Check if Container is Running
```bash
ssh root@178.156.194.89 "docker ps | grep storefront"
```

### Check if Code is in Container
```bash
ssh root@178.156.194.89 "docker exec hunter-irrigation-storefront cat /app/app/layout.tsx | grep GA_US_ID"
```

### Check Live Site
```bash
# Should show GA script
curl -s https://hunterirrigationsupply.com | grep -i gtag

# Should show GA ID
curl -s https://hunterirrigationsupply.com | grep -o 'G-BSL225PG0B'
```

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

4. **Verify in browser:**
   - Visit https://hunterirrigationsupply.com
   - Open DevTools → Network tab
   - Filter for "gtag"
   - Refresh page
   - Should see request to `www.googletagmanager.com/gtag/js?id=G-BSL225PG0B`

## Expected Behavior

- **USA Site**: Loads `G-BSL225PG0B`
- **Canada Site**: Loads `G-9LK4JKHQSP`
- Scripts load after page is interactive (Next.js `afterInteractive` strategy)
- May not appear in initial HTML curl (loads via JavaScript)

## Browser Verification (Most Reliable)

1. Open site in browser
2. DevTools → Network tab
3. Filter: "gtag" or "googletagmanager"
4. Refresh page
5. Should see GA script requests

