# Security Hardening Guide

This document outlines all security measures implemented for the Vendure deployment.

## 🔒 Security Measures Implemented

### 1. Firewall Configuration (UFW)

**Status:** ✅ Implemented

- Only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) are open
- All other ports are blocked by default
- Outgoing traffic is allowed
- Database and Redis ports are not exposed

**Impact on Customers:** ✅ **ZERO** - Customers can still access the website normally

### 2. PostgreSQL Security

**Status:** ✅ Implemented

- PostgreSQL listens only on `localhost` (127.0.0.1)
- Not accessible from the internet
- Strong password authentication required
- Connection limited to local connections only

**Configuration:**
- `listen_addresses = 'localhost'` in `postgresql.conf`
- `pg_hba.conf` restricts to local connections only

### 3. Redis Security

**Status:** ✅ Implemented

- Redis bound to `localhost` only
- Strong password authentication required
- Dangerous commands disabled (FLUSHALL, FLUSHDB, CONFIG)
- Not accessible from the internet

**Configuration:**
- `bind 127.0.0.1` in `redis.conf`
- `requirepass` set with strong password
- Commands renamed to empty string

### 4. SSH Hardening

**Status:** ✅ Implemented

- Empty passwords disabled
- Max authentication tries: 3
- X11 forwarding disabled
- Root login can be disabled (optional)

**Note:** Password authentication is still enabled by default. Consider disabling if using SSH keys.

### 5. Fail2ban

**Status:** ✅ Implemented

- Protects against brute force attacks
- Bans IPs after 5 failed attempts
- Ban duration: 1 hour
- Monitors SSH and other services

### 6. Automatic Security Updates

**Status:** ✅ Implemented

- Unattended upgrades enabled
- Security updates installed automatically
- System packages kept up to date
- No automatic reboots (manual control)

### 7. File Permissions

**Status:** ✅ Implemented

- `.env` file: 600 (read/write for owner only)
- Project files: Proper ownership and permissions
- Sensitive files protected

### 8. Security Headers (Caddy)

**Status:** ✅ Implemented

- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - HSTS for HTTPS
- `Content-Security-Policy` - CSP for XSS protection
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

### 9. Environment Variable Security

**Status:** ✅ Implemented

- All secrets stored in `.env` file
- Strong password generation (32+ characters)
- Secure token generation
- No hardcoded credentials
- Validation on startup

### 10. CORS Configuration

**Status:** ✅ Implemented

- Specific allowed origins only
- Credentials enabled for trusted domains
- No wildcard origins in production

## 🛡️ Security Best Practices

### Password Requirements

- **Database Password:** 32+ characters, base64 encoded
- **Cookie Secret:** 32+ characters, base64 encoded
- **Channel Tokens:** 32+ characters, hexadecimal
- **Redis Password:** 32+ characters, base64 encoded

### Network Security

- Database: localhost only
- Redis: localhost only
- API: localhost only (accessed via Caddy)
- Storefront: localhost only (accessed via Caddy)
- Only Caddy (ports 80/443) exposed to internet

### Access Control

- Services run as dedicated `vendure` user
- No root access for application processes
- Proper file ownership and permissions
- Environment variables protected

## 🔍 Security Testing

Run the comprehensive test suite:

```bash
bash infra/test-all.sh
```

This tests:
- ✅ Service status
- ✅ Database security
- ✅ Redis security
- ✅ API endpoints
- ✅ Storefront accessibility
- ✅ Security headers
- ✅ Firewall configuration
- ✅ File permissions
- ✅ Environment variables

## 📋 Security Checklist

Before going live, verify:

- [ ] Firewall is active and configured
- [ ] Database is not accessible from internet
- [ ] Redis is not accessible from internet
- [ ] All passwords are strong (32+ characters)
- [ ] No default passwords in use
- [ ] `.env` file has 600 permissions
- [ ] Fail2ban is running
- [ ] Security updates are enabled
- [ ] SSH is hardened (or use keys)
- [ ] Security headers are present
- [ ] CORS is properly configured
- [ ] All tests pass: `bash infra/test-all.sh`

## 🚨 Incident Response

If you suspect a security breach:

1. **Immediately:**
   - Change all passwords
   - Rotate all tokens
   - Review logs: `journalctl -u vendure-api -f`
   - Check fail2ban: `fail2ban-client status`

2. **Investigate:**
   - Review access logs
   - Check for unauthorized changes
   - Review database for suspicious activity

3. **Recover:**
   - Restore from backup if needed
   - Update all credentials
   - Review and strengthen security measures

## 📚 Additional Resources

- [Vendure Security Best Practices](https://docs.vendure.io/guides/developer-guide/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Ubuntu Security Guide](https://ubuntu.com/security)

## 🔄 Regular Security Maintenance

**Weekly:**
- Review fail2ban logs
- Check for failed login attempts
- Review service logs

**Monthly:**
- Review and update dependencies
- Check for security advisories
- Review firewall rules
- Test backups

**Quarterly:**
- Rotate passwords and tokens
- Security audit
- Review access logs
- Update security documentation

