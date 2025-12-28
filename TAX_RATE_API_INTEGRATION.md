# Tax Rate API Integration Guide

**Date:** December 23, 2025  
**Status:** ✅ Ready to implement

---

## Overview

This guide explains how to integrate public tax rate APIs with your Vendure store to automatically fetch and sync US and Canadian tax rates.

---

## Available Tax Rate APIs

### 1. **SalesTaxAPI** (Recommended)
- **URL:** https://www.salestaxapi.io
- **Features:**
  - Accurate, up-to-date rates for all 50 US states
  - Daily updates from official sources
  - Sub-100ms response times
  - 99.9% uptime
- **Pricing:** Free tier available, paid plans for higher volume
- **API Endpoint:** `https://api.salestaxapi.io/v1/rate?zip={zipCode}`

### 2. **Ziptax**
- **URL:** https://platform.zip.tax
- **Features:**
  - Real-time sales tax for 12,000+ jurisdictions
  - Address-level accuracy
  - Lightweight API
- **Pricing:** 1,000 free calls/month, affordable paid plans
- **API Endpoint:** `https://api.zip.tax/v1/rate?zip={zipCode}`

### 3. **Tax Data API**
- **URL:** https://www.taxdata.io
- **Features:**
  - VAT, tax, and sales tax calculations
  - Supports multiple countries
  - IP-based or country code lookup
- **Pricing:** Free tier available
- **API Endpoint:** `https://api.taxdata.io/v1/rate?country={code}&state={code}`

### 4. **Zip2Tax**
- **URL:** https://www.zip2tax.com
- **Features:**
  - Dynamic Sales Tax Rate API
  - Doorstep-level precision
  - Multiple accuracy levels
- **Pricing:** Various plans available
- **API Endpoint:** Varies by plan

---

## Implementation Options

### Option 1: Annual Rate Tables (No API - Free)
**Best for:** Budget-conscious, stable rates

- Uses pre-configured 2024-2025 tax rates
- No API calls needed
- No ongoing costs
- Rates updated annually via script

**Usage:**
```bash
cd /opt/hunter-irrigation/apps/api
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=vendure
export DB_USERNAME=vendure
export DB_PASSWORD=your-password
export COOKIE_SECRET=your-secret
pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates.ts
```

### Option 2: Live API Rates (Paid)
**Best for:** Accurate, real-time rates, high volume

**Setup:**
1. Sign up for API provider (e.g., SalesTaxAPI)
2. Get API key
3. Set environment variables:
```bash
export TAX_API_PROVIDER=salestaxapi
export TAX_API_KEY=your-api-key-here
export TAX_USE_LIVE_RATES=true
```

**Run sync:**
```bash
cd /opt/hunter-irrigation/apps/api
export TAX_API_PROVIDER=salestaxapi
export TAX_API_KEY=your-api-key
export TAX_USE_LIVE_RATES=true
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=vendure
export DB_USERNAME=vendure
export DB_PASSWORD=your-password
export COOKIE_SECRET=your-secret
pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates.ts
```

---

## Tax Rates Included

### US States (2024-2025 Default Rates)
- All 50 states + DC
- State-level base rates
- Can be enhanced with zip-code level accuracy via API

### Canadian Provinces
- **Alberta (AB):** 5% GST
- **British Columbia (BC):** 5% GST + 7% PST = 12%
- **Manitoba (MB):** 5% GST + 7% PST = 12%
- **New Brunswick (NB):** 15% HST
- **Newfoundland and Labrador (NL):** 15% HST
- **Nova Scotia (NS):** 15% HST
- **Northwest Territories (NT):** 5% GST
- **Nunavut (NU):** 5% GST
- **Ontario (ON):** 13% HST
- **Prince Edward Island (PE):** 15% HST
- **Quebec (QC):** 5% GST + 9.975% QST = 14.975%
- **Saskatchewan (SK):** 5% GST + 6% PST = 11%
- **Yukon (YT):** 5% GST

---

## Files Created

### 1. Tax Rate API Service
**File:** `apps/api/src/plugins/tax-rate-api/tax-rate-api.service.ts`

**Features:**
- Fetches rates from multiple API providers
- Caching support (24 hours for live, 1 year for annual)
- Canadian province rate lookup
- US state default rates
- Automatic Vendure tax rate creation/updates

### 2. Sync Tax Rates Script
**File:** `apps/api/src/scripts/sync-tax-rates.ts`

**Features:**
- Syncs all US state rates
- Syncs all Canadian province rates
- Supports API or annual rate tables
- Environment variable configuration

---

## Integration Steps

### Step 1: Install Dependencies
No additional dependencies needed - uses native `fetch` API.

### Step 2: Register Service (if using as plugin)
Add to `apps/api/src/vendure-config.ts`:
```typescript
import { TaxRateApiService } from './plugins/tax-rate-api/tax-rate-api.service';

// In providers array:
providers: [
  TaxRateApiService,
  // ... other providers
],
```

### Step 3: Run Initial Sync
```bash
cd /opt/hunter-irrigation/apps/api
pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates.ts
```

### Step 4: Schedule Regular Updates
Add to cron or scheduled task:
```bash
# Annual rates - run once per year
0 0 1 1 * cd /opt/hunter-irrigation/apps/api && pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates.ts

# Live rates - run daily
0 2 * * * cd /opt/hunter-irrigation/apps/api && export TAX_API_PROVIDER=salestaxapi && export TAX_API_KEY=your-key && export TAX_USE_LIVE_RATES=true && pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates.ts
```

---

## API Provider Comparison

| Provider | Free Tier | Accuracy | Update Frequency | Best For |
|----------|-----------|----------|------------------|----------|
| **SalesTaxAPI** | Limited | High | Daily | Production use |
| **Ziptax** | 1,000/month | Very High | Real-time | High accuracy needs |
| **Tax Data API** | Limited | Medium | Real-time | Multi-country |
| **Zip2Tax** | Paid only | Very High | Real-time | Enterprise |
| **Annual Tables** | Free | Medium | Yearly | Budget-conscious |

---

## Cost Estimates

### Annual Rate Tables (Free)
- **Cost:** $0/month
- **Updates:** Manual (once per year)
- **Accuracy:** State-level

### SalesTaxAPI
- **Free Tier:** Limited requests
- **Starter:** ~$29/month
- **Professional:** ~$99/month
- **Enterprise:** Custom pricing

### Ziptax
- **Free:** 1,000 requests/month
- **Starter:** ~$19/month (5,000 requests)
- **Professional:** ~$49/month (25,000 requests)

---

## Recommendations

### For Your Use Case (Hunter Irrigation Supply):

**Recommended:** Start with **Annual Rate Tables** (free)
- Low cost
- Sufficient accuracy for most sales
- Easy to implement
- Can upgrade to API later if needed

**If you need higher accuracy:**
- Use **Ziptax** (1,000 free requests/month)
- Or **SalesTaxAPI** (paid plan for higher volume)

---

## Testing

After syncing tax rates:

1. **Check Vendure Admin:**
   - Go to: Settings → Tax Rates
   - Verify US and Canadian rates are present

2. **Test Order:**
   - Create test order with US address
   - Verify tax calculation
   - Create test order with Canadian address
   - Verify tax calculation

3. **Verify Rates:**
   ```sql
   SELECT name, value, enabled FROM tax_rate ORDER BY name;
   ```

---

## Troubleshooting

### Issue: "API key invalid"
**Fix:** Verify API key is correct and account is active

### Issue: "Rate limit exceeded"
**Fix:** Upgrade plan or use annual rate tables

### Issue: "Tax rates not applying"
**Fix:** Ensure zones are properly configured and tax rates are enabled

---

## Next Steps

1. ✅ Run initial sync with annual rates (free)
2. ⚠️ Test tax calculations in test orders
3. ⚠️ Consider upgrading to API if accuracy is critical
4. ⚠️ Schedule regular updates (cron job)

---

**Last Updated:** December 23, 2025  
**Status:** Ready to implement


