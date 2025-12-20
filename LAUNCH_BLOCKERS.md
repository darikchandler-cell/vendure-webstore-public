# Launch Blockers - Diagnosis & Fix Guide

## 🔍 How to Diagnose

Run the comprehensive diagnosis script on your Hetzner server:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
bash infra/diagnose-launch-blockers.sh
```

This will check:
- ✅ Server environment
- ✅ System services (PostgreSQL, Redis, Caddy, Vendure services)
- ✅ Port availability
- ✅ Database connectivity and data
- ✅ Environment configuration
- ✅ Local API endpoints
- ✅ Local storefront
- ✅ Caddy configuration
- ✅ External access (via Cloudflare)
- ✅ Firewall settings
- ✅ Disk space
- ✅ Error logs

## 🚫 Common Launch Blockers

### 1. Services Not Running
**Symptom:** 502 Bad Gateway errors

**Check:**
```bash
systemctl status vendure-api
systemctl status vendure-worker
systemctl status vendure-storefront
systemctl status caddy
```

**Fix:**
```bash
# Start all services
systemctl start vendure-api vendure-worker vendure-storefront caddy
systemctl enable vendure-api vendure-worker vendure-storefront caddy

# Check why they're not starting
journalctl -u vendure-api -n 50
journalctl -u vendure-storefront -n 50
```

### 2. Database Not Accessible
**Symptom:** API returns 500 errors, connection refused

**Check:**
```bash
sudo -u postgres psql -U vendure -d vendure -c "SELECT 1;"
```

**Fix:**
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check .env has correct DB credentials
cat /opt/hunter-irrigation/.env | grep DB_

# Restart PostgreSQL if needed
systemctl restart postgresql
```

### 3. Missing Superadmin User
**Symptom:** Cannot login, "Invalid credentials"

**Check:**
```bash
sudo -u postgres psql -U vendure -d vendure -c "SELECT identifier FROM \"user\" WHERE identifier LIKE '%admin%';"
```

**Fix:**
```bash
cd /opt/hunter-irrigation
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'
```

### 4. Missing Channels
**Symptom:** Products not showing, channel errors

**Check:**
```bash
sudo -u postgres psql -U vendure -d vendure -c "SELECT code FROM channel;"
```

**Fix:**
```bash
cd /opt/hunter-irrigation
sudo -u vendure bash -c 'cd apps/api && node dist/create-channels.js'
```

### 5. Missing Environment Variables
**Symptom:** Services fail to start, connection errors

**Check:**
```bash
cd /opt/hunter-irrigation
cat .env | grep -E "DB_|COOKIE_SECRET|CHANNEL_TOKEN"
```

**Fix:**
```bash
# Create from template if missing
cp .env.template .env
nano .env  # Edit with correct values
chmod 600 .env
chown vendure:vendure .env
```

### 6. Caddy Not Configured
**Symptom:** 502 errors, domains not routing

**Check:**
```bash
cat /etc/caddy/Caddyfile | grep hunterirrigationsupply.com
systemctl status caddy
```

**Fix:**
```bash
cp /opt/hunter-irrigation/infra/caddy/Caddyfile.native /etc/caddy/Caddyfile
systemctl reload caddy
journalctl -u caddy -n 50
```

### 7. Firewall Blocking Ports
**Symptom:** External access fails, services unreachable

**Check:**
```bash
ufw status
```

**Fix:**
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

### 8. Cloudflare SSL Issues
**Symptom:** SSL errors, 525 errors

**Check:**
- Cloudflare Dashboard → SSL/TLS → Overview
- Should be "Full" or "Full (Strict)"

**Fix:**
- Set SSL/TLS mode to "Full" (not "Flexible")
- Ensure Caddy is handling HTTPS correctly

### 9. Code Not Deployed
**Symptom:** Old errors, missing features

**Check:**
```bash
cd /opt/hunter-irrigation
git status
ls -la apps/api/dist/
```

**Fix:**
```bash
cd /opt/hunter-irrigation
git pull origin main
sudo -u vendure bash -c 'cd /opt/hunter-irrigation && pnpm install && pnpm build'
systemctl restart vendure-api vendure-worker vendure-storefront
```

### 10. Disk Space Full
**Symptom:** Builds fail, services crash

**Check:**
```bash
df -h
```

**Fix:**
```bash
# Clean up old logs
journalctl --vacuum-time=7d

# Clean Docker (if still using)
docker system prune -af

# Remove old builds
rm -rf /opt/hunter-irrigation/apps/*/node_modules/.cache
```

## 🚀 Quick Fix Script

If you need to fix everything at once:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation

# 1. Ensure .env exists
if [ ! -f .env ]; then
  cp .env.template .env
  echo "⚠️  Edit .env with correct values!"
  nano .env
fi

# 2. Install dependencies and build
sudo -u vendure bash -c 'cd /opt/hunter-irrigation && pnpm install && pnpm build'

# 3. Run migrations
sudo -u vendure bash -c 'cd apps/api && pnpm run migration:run'

# 4. Seed data (creates superadmin)
sudo -u vendure bash -c 'cd apps/api && pnpm run seed'

# 5. Create channels
sudo -u vendure bash -c 'cd apps/api && node dist/create-channels.js'

# 6. Configure Caddy
cp infra/caddy/Caddyfile.native /etc/caddy/Caddyfile
systemctl reload caddy

# 7. Start all services
systemctl start vendure-api vendure-worker vendure-storefront
systemctl enable vendure-api vendure-worker vendure-storefront

# 8. Check status
systemctl status vendure-api vendure-worker vendure-storefront caddy

# 9. Run diagnosis
bash infra/diagnose-launch-blockers.sh
```

## 📋 Pre-Launch Checklist

Before going live, ensure:

- [ ] All services running (`systemctl status vendure-*`)
- [ ] Database accessible and has data
- [ ] Superadmin user exists
- [ ] Channels created (US and CA)
- [ ] Environment variables set correctly
- [ ] Caddy configured and running
- [ ] Firewall allows 80, 443, 22
- [ ] Cloudflare SSL set to "Full"
- [ ] External access works (no 502 errors)
- [ ] Login works (`bash infra/test-login.sh`)
- [ ] Both storefronts load
- [ ] No critical errors in logs

## 🔧 Emergency Rollback

If something breaks:

```bash
# Stop all services
systemctl stop vendure-api vendure-worker vendure-storefront

# Check logs
journalctl -u vendure-api -n 100
journalctl -u vendure-storefront -n 100

# Restore from backup (if you have one)
# Then restart services
systemctl start vendure-api vendure-worker vendure-storefront
```

## 📞 Support

If blockers persist:
1. Run `bash infra/diagnose-launch-blockers.sh`
2. Check service logs: `journalctl -u vendure-api -n 100`
3. Review error messages
4. Check Cloudflare dashboard for DNS/SSL issues

