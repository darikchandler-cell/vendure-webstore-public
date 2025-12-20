# Quick Start - Native Deployment (No Docker)

This is the **recommended** approach for production on Hetzner.

## One-Command Setup

SSH to your Hetzner server and run:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
chmod +x infra/setup-hetzner-native.sh
sudo ./infra/setup-hetzner-native.sh
```

This script will:
- ✅ Install PostgreSQL 15, Redis 7, Node.js 20, pnpm, PM2, Caddy
- ✅ Create vendure user
- ✅ Setup database
- ✅ Create systemd services
- ✅ Generate secure passwords and tokens

## After Setup

1. **Deploy your code:**
   ```bash
   # Copy project files to /opt/hunter-irrigation
   # Or use git:
   cd /opt
   git clone <your-repo-url> hunter-irrigation
   cd hunter-irrigation
   ```

2. **Configure environment:**
   ```bash
   cp .env.template .env
   nano .env
   # Use the passwords/tokens generated during setup
   ```

3. **Install and build:**
   ```bash
   sudo -u vendure bash -c 'cd /opt/hunter-irrigation && pnpm install && pnpm build'
   ```

4. **Run migrations:**
   ```bash
   sudo -u vendure bash -c 'cd /opt/hunter-irrigation/apps/api && pnpm run migration:run'
   ```

5. **Create channels:**
   ```bash
   sudo -u vendure bash -c 'cd /opt/hunter-irrigation/apps/api && node dist/create-channels.js'
   ```

6. **Configure Caddy:**
   ```bash
   cp /opt/hunter-irrigation/infra/caddy/Caddyfile.native /etc/caddy/Caddyfile
   systemctl reload caddy
   ```

7. **Start services:**
   ```bash
   systemctl start vendure-api vendure-worker vendure-storefront
   systemctl enable vendure-api vendure-worker vendure-storefront
   ```

## Verify

```bash
# Check services
systemctl status vendure-api
systemctl status vendure-worker
systemctl status vendure-storefront

# View logs
journalctl -u vendure-api -f
```

## Access

- Storefront: https://hunterirrigationsupply.com
- CA Storefront: https://hunterirrigation.ca
- Admin: https://hunterirrigationsupply.com/admin

## Full Documentation

See [DEPLOYMENT_NATIVE.md](./DEPLOYMENT_NATIVE.md) for complete documentation.

