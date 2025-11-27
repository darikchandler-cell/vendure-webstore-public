# Quick Deployment Guide - Server 178.156.194.89

Your domains are already configured:
- ✅ `hunterirrigationsupply.com` → 178.156.194.89
- ✅ `hunterirrigation.ca` → 178.156.194.89

## Step 1: Connect to Your Server

```bash
ssh root@178.156.194.89
# or if you have a non-root user:
ssh your-user@178.156.194.89
```

## Step 2: Clone the Repository

```bash
# Create project directory
sudo mkdir -p /opt/hunter-irrigation
sudo chown $USER:$USER /opt/hunter-irrigation

# Clone your repository (replace with your actual repo URL)
cd /opt
git clone <your-repo-url> hunter-irrigation
# OR if you need to upload the code:
# - Use scp, rsync, or git clone from your local machine
```

## Step 3: Run Deployment Script

```bash
cd /opt/hunter-irrigation
chmod +x infra/deploy-to-server.sh
./infra/deploy-to-server.sh
```

The script will:
- Install Docker, Node.js, pnpm if needed
- Install dependencies
- Build applications
- Start all services
- Run migrations
- Create channels

## Step 4: Configure Environment Variables

**IMPORTANT:** Before the services work properly, you need to configure environment variables:

```bash
# Edit root .env
nano .env

# Edit Vendure API .env
nano apps/api/.env

# Edit Storefront .env
nano apps/storefront/.env
```

### Key Variables to Set:

**Root `.env`:**
```env
POSTGRES_PASSWORD=your-secure-password
COOKIE_SECRET=generate-a-random-32-char-string
```

**`apps/api/.env`:**
```env
DB_PASSWORD=your-secure-password
COOKIE_SECRET=generate-a-random-32-char-string
SUPERADMIN_PASSWORD=change-this-password
US_CHANNEL_TOKEN=us-channel-token
CA_CHANNEL_TOKEN=ca-channel-token
```

**`apps/storefront/.env`:**
```env
NEXT_PUBLIC_VENDURE_API_URL=http://vendure-api:3000
NEXT_PUBLIC_US_CHANNEL_TOKEN=us-channel-token
NEXT_PUBLIC_CA_CHANNEL_TOKEN=ca-channel-token
```

## Step 5: Restart Services

After configuring environment variables:

```bash
docker compose down
docker compose up -d
```

## Step 6: Verify Deployment

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Test access
curl http://localhost
```

## Step 7: Access Your Sites

Once Caddy provisions SSL (automatic, may take a few minutes):

- **Storefront (US):** https://hunterirrigationsupply.com
- **Storefront (CA):** https://hunterirrigation.ca
- **Admin UI:** https://hunterirrigationsupply.com/admin
- **Shop API:** https://hunterirrigationsupply.com/shop-api

## Troubleshooting

### Services won't start:
```bash
docker compose logs
```

### Database connection errors:
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection
docker compose exec postgres psql -U vendure -d vendure
```

### Caddy SSL issues:
```bash
# Check Caddy logs
docker compose logs caddy

# Verify DNS
dig hunterirrigationsupply.com
dig hunterirrigation.ca
```

### Port conflicts:
```bash
# Check what's using port 80/443
sudo netstat -tulpn | grep -E ':(80|443)'
```

## Quick Commands Reference

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f vendure-api
docker compose logs -f storefront
docker compose logs -f caddy

# Restart a service
docker compose restart vendure-api

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild and restart
docker compose build
docker compose up -d
```

## Next Steps After Deployment

1. **Change default admin password** in Vendure Admin UI
2. **Configure S3 storage** (if using cloud storage for assets)
3. **Set up email** (SMTP configuration for order emails)
4. **Add products** via Admin UI or seed script
5. **Configure payment methods** in Vendure
6. **Set up monitoring** (optional but recommended)

## Need Help?

- Check logs: `docker compose logs -f`
- Review documentation: `README.md`, `DEPLOYMENT.md`, `ARCHITECTURE.md`
- Vendure docs: https://docs.vendure.io

