# Deployment Guide

Complete guide for deploying the Hunter Irrigation ecommerce platform to Hetzner Cloud (Ubuntu 22.04).

## Prerequisites

- Hetzner Cloud server running Ubuntu 22.04
- Domain names configured and pointing to your server IP:
  - `hunterirrigationsupply.com`
  - `hunterirrigation.ca`
- SSH access to the server

## Quick Start

### 1. Connect to Your Server

```bash
ssh root@your-server-ip
```

### 2. Clone the Repository

```bash
git clone <your-repo-url> /opt/hunter-irrigation
cd /opt/hunter-irrigation
```

### 3. Run Automated Deployment

```bash
chmod +x infra/deploy.sh
./infra/deploy.sh
```

The script will:
- Install all prerequisites (Docker, Node.js, pnpm)
- Build the applications
- Start all services
- Run database migrations
- Create channels
- Seed initial data

### 4. Configure Environment Variables

Edit the environment files with your production values:

```bash
# Root .env
nano .env

# Vendure API
nano apps/api/.env

# Storefront
nano apps/storefront/.env
```

**Important variables to set:**

- Database credentials
- Redis configuration
- S3 storage credentials (if using)
- Channel tokens
- Cookie secret (generate a secure random string)
- SMTP settings for emails

### 5. Restart Services

After updating environment variables:

```bash
docker compose down
docker compose up -d
```

## Manual Deployment Steps

If you prefer manual deployment:

### Step 1: Install Prerequisites

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git curl

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Enable Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### Step 2: Build Applications

```bash
cd /opt/hunter-irrigation
pnpm install
pnpm build
```

### Step 3: Configure Environment

Copy and edit environment files:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env

# Edit with your values
nano .env
nano apps/api/.env
nano apps/storefront/.env
```

### Step 4: Start Services

```bash
docker compose build
docker compose up -d
```

### Step 5: Initialize Database

```bash
cd apps/api

# Run migrations
pnpm run migration:run

# Create channels
ts-node -r tsconfig-paths/register src/create-channels.ts

# Seed data (optional)
pnpm run seed
```

## Post-Deployment

### 1. Verify Services

Check that all services are running:

```bash
docker compose ps
```

You should see:
- postgres (healthy)
- redis (healthy)
- vendure-api (running)
- vendure-worker (running)
- storefront (running)
- caddy (running)

### 2. Test Access

- Storefront: `http://your-server-ip`
- Admin UI: `http://your-server-ip/admin`
- Shop API: `http://your-server-ip/shop-api`

### 3. Configure DNS

Point your domains to the server IP:

```
A Record: hunterirrigationsupply.com → your-server-ip
A Record: www.hunterirrigationsupply.com → your-server-ip
A Record: hunterirrigation.ca → your-server-ip
A Record: www.hunterirrigation.ca → your-server-ip
```

### 4. SSL/TLS

Caddy will automatically provision Let's Encrypt certificates once DNS is configured. Check logs:

```bash
docker compose logs caddy
```

## Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f vendure-api
docker compose logs -f storefront
docker compose logs -f caddy
```

### Restart Services

```bash
# All services
docker compose restart

# Specific service
docker compose restart vendure-api
```

### Update Application

```bash
cd /opt/hunter-irrigation
git pull
pnpm install
pnpm build
docker compose build
docker compose up -d

# Run migrations if needed
cd apps/api
pnpm run migration:run
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U vendure vendure > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U vendure vendure < backup-20231201.sql
```

## Troubleshooting

### Services Won't Start

1. Check logs: `docker compose logs`
2. Verify environment variables are set correctly
3. Check port conflicts: `sudo netstat -tulpn | grep :80`

### Database Connection Errors

1. Verify PostgreSQL is running: `docker compose ps postgres`
2. Check connection string in `apps/api/.env`
3. Test connection: `docker compose exec postgres psql -U vendure -d vendure`

### Caddy SSL Issues

1. Check DNS is properly configured
2. Verify ports 80 and 443 are open: `sudo ufw status`
3. Check Caddy logs: `docker compose logs caddy`

### Channel Detection Not Working

1. Verify channel tokens in environment variables
2. Check Caddy is forwarding Host header correctly
3. Test channel detection: Check browser network tab for `vendure-token` header

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate secure `COOKIE_SECRET` (32+ characters)
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up regular database backups
- [ ] Enable fail2ban for SSH protection
- [ ] Keep system and Docker images updated
- [ ] Use strong database passwords
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and alerts

## Performance Optimization

1. **Enable Redis caching** - Already configured if Redis is running
2. **CDN for assets** - Configure S3 with CloudFront or similar
3. **Database indexing** - Vendure creates indexes automatically
4. **Image optimization** - Next.js handles this automatically
5. **Enable gzip/brotli** - Caddy handles this automatically

## Scaling

To add more nodes or a load balancer:

1. Set up additional servers with the same configuration
2. Use a shared database (external PostgreSQL)
3. Use a shared Redis instance
4. Configure Hetzner Load Balancer to distribute traffic
5. Update Caddyfile to handle load balancing

## Support

For issues or questions:
- Check logs: `docker compose logs`
- Review Vendure documentation: https://docs.vendure.io
- Review Next.js documentation: https://nextjs.org/docs

