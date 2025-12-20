# Final Verification Checklist

Complete verification that everything works and login is functional.

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All code is in `/opt/hunter-irrigation` on server
- [ ] `.env` file is configured with all required variables
- [ ] Database password is strong (32+ characters)
- [ ] Cookie secret is strong (32+ characters)
- [ ] Channel tokens are strong (32+ characters)
- [ ] Superadmin credentials are set (or using defaults)

## 🚀 Deployment Steps

### Step 1: Initial Setup (First Time Only)

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
chmod +x infra/setup-hetzner-native.sh
sudo ./infra/setup-hetzner-native.sh
```

**Save the database password and tokens displayed!**

### Step 2: Deploy Code

```bash
# Copy your code to /opt/hunter-irrigation
# Or use git:
cd /opt
git clone <your-repo-url> hunter-irrigation
cd hunter-irrigation
```

### Step 3: Configure Environment

```bash
cd /opt/hunter-irrigation
cp .env.template .env
nano .env
# Use passwords/tokens from Step 1
# Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD if different from defaults
```

### Step 4: Complete Deployment

```bash
cd /opt/hunter-irrigation
bash infra/deploy-complete.sh
```

This will:
- Install dependencies
- Build applications
- Run migrations
- **Seed initial data (creates superadmin)**
- Create channels
- Configure Caddy
- Start all services
- Test endpoints

### Step 5: Verify Everything

```bash
# Run comprehensive tests
bash infra/test-all.sh

# Test login specifically
bash infra/test-login.sh
```

## 🔐 Login Verification

### Default Credentials

- **Email:** `admin@hunterirrigationsupply.com`
- **Password:** `superadmin`

Or check `.env` for `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`.

### Test Login

1. **Via Browser:**
   - Go to: https://hunterirrigationsupply.com/admin/login
   - Enter credentials
   - Should redirect to dashboard

2. **Via Script:**
   ```bash
   bash infra/test-login.sh
   ```

3. **Via API:**
   ```bash
   curl -X POST http://localhost:3000/admin-api \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation { login(username: \"admin@hunterirrigationsupply.com\", password: \"superadmin\") { ... on CurrentUser { id identifier } } }"}'
   ```

## ✅ Complete Verification Checklist

### Services
- [ ] All services running: `systemctl status vendure-*`
- [ ] API health check: `curl http://localhost:3000/health`
- [ ] Storefront accessible: `curl http://localhost:3001`
- [ ] Caddy running: `systemctl status caddy`

### Database
- [ ] Database accessible: `sudo -u postgres psql -U vendure -d vendure -c "SELECT 1;"`
- [ ] Superadmin exists: `sudo -u postgres psql -U vendure -d vendure -c "SELECT identifier FROM \"user\" WHERE identifier LIKE '%admin%';"`
- [ ] Channels exist: `sudo -u postgres psql -U vendure -d vendure -c "SELECT code FROM channel;"`

### Security
- [ ] Firewall active: `ufw status`
- [ ] Database localhost only: `netstat -tlnp | grep 5432`
- [ ] Redis localhost only: `netstat -tlnp | grep 6379`
- [ ] .env file permissions: `ls -la /opt/hunter-irrigation/.env` (should be 600)

### Login
- [ ] Admin login page loads: https://hunterirrigationsupply.com/admin/login
- [ ] Can login with credentials
- [ ] Redirected to dashboard
- [ ] No console errors
- [ ] Can navigate admin panel

### Storefronts
- [ ] US site loads: https://hunterirrigationsupply.com
- [ ] CA site loads: https://hunterirrigation.ca
- [ ] Products display (if any seeded)
- [ ] Correct currency per site

### API Endpoints
- [ ] Shop API: `curl http://localhost:3000/shop-api`
- [ ] Admin API: `curl -I http://localhost:3000/admin-api`
- [ ] Assets: `curl http://localhost:3000/assets`

## 🐛 Common Issues & Fixes

### Login Returns 500 Error

**Fix:**
```bash
# Check API logs
journalctl -u vendure-api -n 50

# If authenticationStrategy error:
sudo -u postgres psql -U vendure -d vendure -c "UPDATE session SET \"authenticationStrategy\" = 'native' WHERE \"authenticationStrategy\" IS NULL;"
systemctl restart vendure-api
```

### Invalid Credentials

**Fix:**
```bash
# Re-seed to create superadmin
cd /opt/hunter-irrigation
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'
```

### Services Not Starting

**Fix:**
```bash
# Check logs
journalctl -u vendure-api -n 100
journalctl -u vendure-worker -n 100
journalctl -u vendure-storefront -n 100

# Check environment
sudo -u vendure bash -c 'cd /opt/hunter-irrigation && cat .env'
```

### Database Connection Failed

**Fix:**
```bash
# Test connection
sudo -u postgres psql -U vendure -d vendure

# Check PostgreSQL
systemctl status postgresql
journalctl -u postgresql -n 50
```

## 📊 All Tests Pass

When all tests pass:

```bash
bash infra/test-all.sh
```

You should see:
- ✅ All services running
- ✅ Database secured
- ✅ Redis secured
- ✅ API endpoints working
- ✅ Storefront accessible
- ✅ Security headers present
- ✅ Firewall configured
- ✅ File permissions correct
- ✅ Environment variables set
- ✅ Login successful

## 🎉 Success Criteria

Everything is working when:

1. ✅ All services are running
2. ✅ All tests pass (`bash infra/test-all.sh`)
3. ✅ Login test passes (`bash infra/test-login.sh`)
4. ✅ Can login via browser
5. ✅ Can access admin dashboard
6. ✅ Both storefronts load
7. ✅ Products display (if seeded)
8. ✅ No errors in logs
9. ✅ Security measures active

## 🔒 Post-Login Security

**IMMEDIATELY after first login:**

1. Change admin password to strong password
2. Update `SUPERADMIN_PASSWORD` in `.env`
3. Restart API: `systemctl restart vendure-api`
4. Verify new password works

## 📞 Quick Reference

**Admin Login:**
- URL: https://hunterirrigationsupply.com/admin/login
- Email: `admin@hunterirrigationsupply.com`
- Password: `superadmin` (change immediately!)

**Test Commands:**
```bash
# All tests
bash infra/test-all.sh

# Login test
bash infra/test-login.sh

# Service status
systemctl status vendure-*

# View logs
journalctl -u vendure-api -f
```

**Important Files:**
- Environment: `/opt/hunter-irrigation/.env`
- API Config: `/opt/hunter-irrigation/apps/api/src/vendure-config.ts`
- Caddy Config: `/etc/caddy/Caddyfile`

