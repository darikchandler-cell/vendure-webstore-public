# Issues Found - Summary

## 🔴 Critical Issues (Must Fix)

### 1. Missing CORS_ORIGINS in Environment Template
**File:** `infra/setup-hetzner-native.sh` (line ~172)

**Problem:** The `.env.template` doesn't include `CORS_ORIGINS` which is required for the API to accept requests from the storefronts.

**Impact:** API will reject requests from storefronts, causing CORS errors.

**Fix:** Add `CORS_ORIGINS` to the template:
```bash
CORS_ORIGINS=https://hunterirrigationsupply.com,https://www.hunterirrigationsupply.com,https://hunterirrigation.ca,https://www.hunterirrigation.ca
```

---

### 2. Variable Expansion Issue in .env Template
**File:** `infra/setup-hetzner-native.sh` (lines 191-192)

**Problem:** The template uses `${US_CHANNEL_TOKEN}` and `${CA_CHANNEL_TOKEN}` in a heredoc, but these won't expand correctly because the variables are generated earlier in the script.

**Impact:** The storefront won't have the correct channel tokens, causing API requests to fail.

**Fix:** Either:
- Generate the tokens before the heredoc and use them directly
- Or use a different approach to inject the values

---

## 🟡 Medium Issues (Should Fix)

### 3. Duplicate Condition in Channel Detection
**File:** `apps/storefront/lib/channel.ts` (line 42)

**Problem:** The condition checks for 'hunterirrigation.ca' twice:
```typescript
if (host.includes('hunterirrigation.ca') || host.includes('hunterirrigation.ca')) {
```

**Impact:** Minor - redundant code, but doesn't break functionality.

**Fix:** Remove duplicate or add check for 'www.hunterirrigation.ca':
```typescript
if (host.includes('hunterirrigation.ca')) {
```

---

### 4. Zone Handling in Channel Creation
**File:** `apps/api/src/create-channels.ts` (line 34)

**Problem:** Falls back to `{ id: 1 }` if no zones exist, but zone ID 1 might not exist either.

**Impact:** Channel creation might fail if zones don't exist and ID 1 is invalid.

**Fix:** Better error handling:
```typescript
const zones = await connection.rawConnection.getRepository('Zone').find();
if (zones.length === 0) {
  throw new Error('No zones found. Please run seed script first to create initial data.');
}
const defaultZone = zones[0];
```

---

### 5. Deploy Script Runs as Root
**File:** `infra/deploy-complete.sh` (line 12)

**Problem:** Script requires root, but some operations should run as the vendure user.

**Impact:** Files might be created with wrong ownership, or security issues.

**Current State:** Script correctly uses `sudo -u "$VENDURE_USER"` for most operations, which is good.

**Note:** This is actually handled correctly, but worth noting for review.

---

## 🟢 Minor Issues (Nice to Fix)

### 6. Markdown Linter Warnings
**Files:** Various `.md` files

**Problem:** 43 markdown formatting warnings (spacing, code blocks, etc.)

**Impact:** None - just documentation formatting.

**Fix:** Can be fixed with markdown formatter, but not critical.

---

### 7. Debug Comments in Production Code
**Files:** `apps/storefront/app/products/page.tsx`, `apps/storefront/app/page.tsx`

**Problem:** Debug logging comments present in production code.

**Impact:** None - just code cleanliness.

**Fix:** Remove or convert to proper logging.

---

## ✅ What's Working Correctly

1. **Environment Variable Validation** - ✅ Properly validates required vars
2. **Security Hardening** - ✅ All security measures in place
3. **Service Configuration** - ✅ Systemd services properly configured
4. **Database Connection** - ✅ Proper pooling and error handling
5. **CORS Configuration** - ✅ Uses environment variables (just missing from template)
6. **Channel Setup** - ✅ Multi-channel configuration correct
7. **Login Functionality** - ✅ Seed script creates superadmin
8. **Error Handling** - ✅ Comprehensive error logging

---

## 🔧 Recommended Fixes (Priority Order)

### Priority 1 (Critical - Fix Before Deployment)
1. ✅ Add `CORS_ORIGINS` to `.env.template`
2. ✅ Fix variable expansion in `.env.template` for channel tokens

### Priority 2 (Important - Fix Soon)
3. ✅ Fix duplicate condition in channel detection
4. ✅ Improve zone handling in channel creation

### Priority 3 (Nice to Have)
5. ✅ Fix markdown formatting
6. ✅ Clean up debug comments

---

## 📋 Quick Fix Checklist

- [ ] Add `CORS_ORIGINS` to `infra/setup-hetzner-native.sh` template
- [ ] Fix channel token variable expansion in template
- [ ] Remove duplicate condition in `apps/storefront/lib/channel.ts`
- [ ] Improve error handling in `apps/api/src/create-channels.ts`
- [ ] Test all fixes before deployment

---

## 🚀 After Fixes

Once these issues are fixed:
1. Run `bash infra/test-all.sh` to verify
2. Test login: `bash infra/test-login.sh`
3. Deploy: `bash infra/deploy-complete.sh`

