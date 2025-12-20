# Verify Login - Complete Checklist

This document helps you verify that admin login works correctly.

## 🔑 Default Admin Credentials

**⚠️ CHANGE THESE AFTER FIRST LOGIN!**

- **Email:** `admin@hunterirrigationsupply.com`
- **Password:** `superadmin`

Or check your `.env` file for:
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`

## ✅ Pre-Login Verification

### 1. Check Services Are Running

```bash
systemctl status vendure-api
systemctl status vendure-worker
systemctl status vendure-storefront
```

All should show `active (running)`.

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Admin API (should return 200, 400, or 401 - not 500)
curl -I http://localhost:3000/admin-api

# Shop API
curl http://localhost:3000/shop-api
```

### 3. Verify Superadmin User Exists

```bash
sudo -u postgres psql -U vendure -d vendure -c "SELECT identifier, emailAddress FROM \"user\" WHERE identifier LIKE '%admin%';"
```

Should show at least one admin user.

### 4. Run Login Test

```bash
cd /opt/hunter-irrigation
bash infra/test-login.sh
```

This will:
- Test API connectivity
- Test Admin API endpoint
- Attempt login with credentials
- Check database for superadmin
- Verify environment variables

## 🔐 Login Process

### Step 1: Access Admin Panel

Open in browser:
- **URL:** https://hunterirrigationsupply.com/admin/login
- Or: https://hunterirrigation.ca/admin/login

### Step 2: Enter Credentials

- **Email:** `admin@hunterirrigationsupply.com`
- **Password:** `superadmin` (or your `SUPERADMIN_PASSWORD` from `.env`)

### Step 3: Verify Login

After clicking "Log in", you should:
- ✅ Be redirected to the admin dashboard
- ✅ See no 500 errors in browser console
- ✅ See no errors in network tab

## 🐛 Troubleshooting Login Issues

### Issue: 500 Internal Server Error

**Cause:** Database session table issue or cookie problem

**Fix:**
```bash
# Check API logs
journalctl -u vendure-api -n 50

# If you see "authenticationStrategy" errors, run:
sudo -u postgres psql -U vendure -d vendure -c "UPDATE session SET \"authenticationStrategy\" = 'native' WHERE \"authenticationStrategy\" IS NULL;"

# Restart API
systemctl restart vendure-api
```

### Issue: Invalid Credentials

**Cause:** Superadmin user not created or wrong password

**Fix:**
```bash
# Re-seed the database (creates superadmin)
cd /opt/hunter-irrigation
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'

# Check credentials in .env
cat /opt/hunter-irrigation/.env | grep SUPERADMIN
```

### Issue: Admin API Returns 500

**Cause:** API not running or database connection issue

**Fix:**
```bash
# Check API status
systemctl status vendure-api

# Check API logs
journalctl -u vendure-api -f

# Test database connection
sudo -u postgres psql -U vendure -d vendure -c "SELECT 1;"
```

### Issue: Page Loads But Login Fails

**Cause:** CORS or cookie issues

**Fix:**
```bash
# Check CORS configuration in .env
cat /opt/hunter-irrigation/.env | grep CORS_ORIGINS

# Verify cookie secret is set
cat /opt/hunter-irrigation/.env | grep COOKIE_SECRET

# Check browser console for CORS errors
```

## ✅ Post-Login Verification

After successful login:

1. **Change Password Immediately**
   - Go to Settings → Administrators
   - Edit your admin account
   - Set a strong password

2. **Verify You Can Access:**
   - ✅ Dashboard
   - ✅ Products
   - ✅ Orders
   - ✅ Customers
   - ✅ Settings

3. **Test Both Channels:**
   - ✅ US channel (hunterirrigationsupply.com)
   - ✅ CA channel (hunterirrigation.ca)

## 🔒 Security After Login

1. **Change Default Password**
   - Use a strong password (16+ characters)
   - Include uppercase, lowercase, numbers, symbols

2. **Update Environment Variables**
   - Set `SUPERADMIN_PASSWORD` in `.env` to your new password
   - Restart services: `systemctl restart vendure-api`

3. **Review Security Settings**
   - Check firewall: `ufw status`
   - Verify fail2ban: `fail2ban-client status`
   - Review logs: `journalctl -u vendure-api -n 100`

## 📋 Complete Verification Checklist

Before considering login "working":

- [ ] All services running (`systemctl status vendure-*`)
- [ ] API health check passes (`curl http://localhost:3000/health`)
- [ ] Admin API accessible (`curl -I http://localhost:3000/admin-api`)
- [ ] Superadmin user exists in database
- [ ] Login test passes (`bash infra/test-login.sh`)
- [ ] Can access admin login page (no 500 errors)
- [ ] Can login with credentials
- [ ] Redirected to dashboard after login
- [ ] No console errors in browser
- [ ] Can navigate admin panel
- [ ] Password changed from default

## 🆘 Still Having Issues?

1. **Check all logs:**
   ```bash
   journalctl -u vendure-api -n 100
   journalctl -u vendure-worker -n 100
   journalctl -u vendure-storefront -n 100
   ```

2. **Run complete test suite:**
   ```bash
   bash infra/test-all.sh
   ```

3. **Verify database:**
   ```bash
   sudo -u postgres psql -U vendure -d vendure
   \dt  # List tables
   SELECT * FROM "user" WHERE identifier LIKE '%admin%';
   \q
   ```

4. **Check environment:**
   ```bash
   sudo -u vendure bash -c 'cd /opt/hunter-irrigation && cat .env | grep -E "SUPERADMIN|COOKIE_SECRET|DB_"'
   ```

