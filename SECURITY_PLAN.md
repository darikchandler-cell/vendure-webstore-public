# Security Hardening Plan - Customer-Focused

## Goal
Secure the infrastructure while maintaining **100% customer accessibility** from anywhere in the world.

---

## What Customers Need Access To

✅ **MUST REMAIN PUBLIC:**
- Port 80 (HTTP) - For website access
- Port 443 (HTTPS) - For secure website access
- Website (hunterirrigationsupply.com, hunterirrigation.ca)
- Shop API (for product browsing, cart, checkout)
- Storefront (Next.js app)

❌ **MUST BE PROTECTED (Not for customers):**
- Port 5432 (PostgreSQL) - Database should be internal only
- Port 6379 (Redis) - Cache should be internal only
- Port 22 (SSH) - Should be restricted or use key-only auth
- Admin API - Should have additional protection

---

## Security Fixes That DON'T Affect Customers

### 1. Database & Redis Protection
**Impact on Customers:** ✅ **ZERO** - Customers never connect to these directly

**What we'll do:**
- Change PostgreSQL port mapping from `0.0.0.0:5432:5432` to `127.0.0.1:5432:5432`
- Change Redis port mapping from `0.0.0.0:6379:6379` to `127.0.0.1:6379:6379`
- Services still work internally, but not accessible from internet

**Result:** Database protected, website still works perfectly

### 2. Firewall Configuration
**Impact on Customers:** ✅ **ZERO** - We'll allow ports 80 and 443

**What we'll do:**
```bash
# Allow customer traffic
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH (for management)

# Block everything else
ufw default deny incoming
ufw default allow outgoing
ufw enable
```

**Result:** Customers can access website, attackers can't access database

### 3. Security Headers
**Impact on Customers:** ✅ **POSITIVE** - Protects customers from attacks

**What we'll do:**
- Add security headers to Caddy (X-Frame-Options, CSP, etc.)
- These protect customers from XSS, clickjacking, etc.

**Result:** Better security for customers, no impact on functionality

### 4. Rate Limiting
**Impact on Customers:** ✅ **MINIMAL** - Only affects abusive traffic

**What we'll do:**
- Set reasonable limits (e.g., 100 requests/minute per IP)
- Legitimate customers won't hit these limits
- Protects against DDoS and scraping

**Result:** Website stays fast, attackers are blocked

---

## Customer Access Flow (After Security Fixes)

```
Customer (Anywhere in World)
    ↓
Cloudflare (DDoS Protection)
    ↓
Port 80/443 (OPEN - For Customers)
    ↓
Caddy (Reverse Proxy)
    ↓
Storefront (Port 3001) ← Customers see this
Shop API (Port 3000)   ← Customers use this
    ↓
Database (Port 5432)   ← INTERNAL ONLY (Customers never touch this)
Redis (Port 6379)      ← INTERNAL ONLY (Customers never touch this)
```

**Result:** Customers have full access, database is protected

---

## Implementation Plan

### Phase 1: Critical Security (No Customer Impact)
1. ✅ Restrict database/Redis to localhost
2. ✅ Configure firewall (allow 80, 443, 22)
3. ✅ Add security headers

### Phase 2: Enhanced Protection (Minimal Customer Impact)
4. ✅ Add rate limiting (reasonable limits)
5. ✅ Enable Cloudflare WAF rules
6. ✅ Set up monitoring

### Phase 3: Advanced Security (Optional)
7. IP whitelist for admin panel (optional)
8. Two-factor authentication for admin
9. Automated security scanning

---

## Testing After Security Fixes

We'll verify:
- ✅ Customers can access website from anywhere
- ✅ Customers can browse products
- ✅ Customers can add to cart
- ✅ Customers can checkout
- ✅ Database is NOT accessible from internet
- ✅ Security headers are present
- ✅ Rate limiting works (but doesn't block legitimate users)

---

## Summary

**All security fixes will:**
- ✅ Keep website 100% accessible to customers worldwide
- ✅ Protect backend services (database, Redis)
- ✅ Improve customer security (headers, rate limiting)
- ✅ Block attackers and bots

**Nothing will:**
- ❌ Block legitimate customer traffic
- ❌ Require customers to do anything different
- ❌ Slow down the website
- ❌ Break any functionality

Ready to implement? These fixes will make your site MORE secure while keeping it fully accessible to customers.

