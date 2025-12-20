# Native Deployment Guide (No Docker)

This guide sets up Vendure on Hetzner without Docker, using Vendure's recommended production approach.

## Architecture

- **PostgreSQL 15**: Native installation
- **Redis 7**: Native installation  
- **Vendure API**: Node.js process (systemd service)
- **Vendure Worker**: Node.js process (systemd service)
- **Next.js Storefront**: Node.js process (systemd service)
- **Caddy**: Reverse proxy with automatic HTTPS

## Prerequisites

- Hetzner Cloud server (Ubuntu 22.04 recommended)
- Root/sudo access
- Domain names pointing to server IP:
  - `hunterirrigationsupply.com`
  - `hunterirrigation.ca`

## Quick Setup

### Step 1: Run Setup Script

SSH to your server and run:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
chmod +x infra/setup-hetzner-native.sh
sudo ./infra/setup-hetzner-native.sh
```

This will install:
- PostgreSQL 15
- Redis 7
- Node.js 20
- pnpm
- PM2 (process manager)
- Caddy (reverse proxy)
- Create vendure user
- Setup database
- Create systemd services

### Step 2: Deploy Your Code

Copy your project files to `/opt/hunter-irrigation`:

```bash
# From your local machine
cd /path/to/vendure-sites
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dist' \
  ./ root@178.156.194.89:/opt/hunter-irrigation/
```

Or use git:

```bash
ssh root@178.156.194.89
cd /opt
git clone <your-repo-url> hunter-irrigation
cd hunter-irrigation
```

### Step 3: Configure Environment

```bash
cd /opt/hunter-irrigation
cp .env.template .env
nano .env
```

**Required variables:**
- `DB_PASSWORD` - Use the password generated during setup
- `COOKIE_SECRET` - Generate with: `openssl rand -base64 32`
- `US_CHANNEL_TOKEN` - Generate with: `openssl rand -hex 16`
- `CA_CHANNEL_TOKEN` - Generate with: `openssl rand -hex 16`
- `NEXT_PUBLIC_US_CHANNEL_TOKEN` - Same as US_CHANNEL_TOKEN
- `NEXT_PUBLIC_CA_CHANNEL_TOKEN` - Same as CA_CHANNEL_TOKEN

### Step 4: Install Dependencies and Build

```bash
sudo -u vendure bash -c 'cd /opt/hunter-irrigation && pnpm install && pnpm build'
```

### Step 5: Run Database Migrations

```bash
sudo -u vendure bash -c 'cd /opt/hunter-irrigation/apps/api && pnpm run migration:run'
```

### Step 6: Create Channels

```bash
sudo -u vendure bash -c 'cd /opt/hunter-irrigation/apps/api && node dist/create-channels.js'
```

This creates:
- US channel (USD currency)
- CA channel (CAD currency)

Both channels share the same product catalog.

### Step 7: Configure Caddy

```bash
cp /opt/hunter-irrigation/infra/caddy/Caddyfile.native /etc/caddy/Caddyfile
systemctl reload caddy
```

### Step 8: Start Services

```bash
systemctl start vendure-api
systemctl start vendure-worker
systemctl start vendure-storefront
systemctl enable vendure-api vendure-worker vendure-storefront
```

### Step 9: Verify

Check service status:

```bash
systemctl status vendure-api
systemctl status vendure-worker
systemctl status vendure-storefront
systemctl status caddy
```

View logs:

```bash
journalctl -u vendure-api -f
journalctl -u vendure-worker -f
journalctl -u vendure-storefront -f
```

Test endpoints:

```bash
curl http://localhost:3000/shop-api
curl http://localhost:3001
```

## Multi-Channel Setup

Vendure uses channels to support multiple storefronts with different currencies/pricing:

- **US Channel**: `hunterirrigationsupply.com` - USD currency
- **CA Channel**: `hunterirrigation.ca` - CAD currency

Both channels share the same product catalog. Products are assigned to both channels, but can have different prices per channel.

The storefront automatically detects the channel based on the hostname (see `apps/storefront/lib/channel.ts`).

## Service Management

### Start/Stop Services

```bash
# Start all
systemctl start vendure-api vendure-worker vendure-storefront

# Stop all
systemctl stop vendure-api vendure-worker vendure-storefront

# Restart all
systemctl restart vendure-api vendure-worker vendure-storefront
```

### View Logs

```bash
# API logs
journalctl -u vendure-api -f

# Worker logs
journalctl -u vendure-worker -f

# Storefront logs
journalctl -u vendure-storefront -f

# All logs
journalctl -u vendure-* -f
```

### Check Status

```bash
systemctl status vendure-api
systemctl status vendure-worker
systemctl status vendure-storefront
```

## Updating

```bash
cd /opt/hunter-irrigation

# Pull latest code
git pull

# Install dependencies
sudo -u vendure bash -c 'pnpm install'

# Build
sudo -u vendure bash -c 'pnpm build'

# Run migrations (if any)
sudo -u vendure bash -c 'cd apps/api && pnpm run migration:run'

# Restart services
systemctl restart vendure-api vendure-worker vendure-storefront
```

## Troubleshooting

### Service won't start

```bash
# Check logs
journalctl -u vendure-api -n 50

# Check permissions
ls -la /opt/hunter-irrigation

# Check environment
sudo -u vendure bash -c 'cd /opt/hunter-irrigation && cat .env'
```

### Database connection issues

```bash
# Test connection
sudo -u postgres psql -U vendure -d vendure

# Check PostgreSQL status
systemctl status postgresql

# Check PostgreSQL logs
journalctl -u postgresql -n 50
```

### Redis connection issues

```bash
# Test connection
redis-cli ping

# Check Redis status
systemctl status redis-server
```

### Caddy issues

```bash
# Check Caddy status
systemctl status caddy

# Test Caddyfile
caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
systemctl reload caddy
```

## Security Notes

1. **Database Password**: Generated during setup - save it securely
2. **Cookie Secret**: Generate a new one for production
3. **Channel Tokens**: Generate secure random tokens
4. **Firewall**: Consider setting up UFW to restrict access
5. **SSL**: Caddy automatically handles SSL certificates

## Backup

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump vendure > /opt/backups/vendure-$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql vendure < /opt/backups/vendure-YYYYMMDD.sql
```

### Automated Backups

Set up a cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * sudo -u postgres pg_dump vendure > /opt/backups/vendure-$(date +\%Y\%m\%d).sql
```

