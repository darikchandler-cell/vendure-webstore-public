# Deployment Commands for diamond-street-services

**Server IP:** 178.156.194.89  
**Repository:** https://github.com/darikchandler-cell/vendure-hunterirrigation

## Quick Deploy (Copy & Paste)

Run these commands **on your server** via SSH:

```bash
# 1. Connect to server
ssh root@178.156.194.89

# 2. Create project directory and clone repository
cd /opt
git clone https://github.com/darikchandler-cell/vendure-hunterirrigation.git hunter-irrigation
cd hunter-irrigation

# 3. Run deployment script
chmod +x infra/deploy-to-server.sh
./infra/deploy-to-server.sh
```

## Step-by-Step Deployment

### Step 1: Connect to Server

```bash
ssh root@178.156.194.89
# Or if you have a different user:
ssh your-user@178.156.194.89
```

### Step 2: Install Prerequisites (if needed)

```bash
# Update system
sudo apt update

# Install Docker
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Install git (if not installed)
sudo apt install -y git
```

### Step 3: Clone Repository

```bash
cd /opt
sudo mkdir -p hunter-irrigation
sudo chown $USER:$USER hunter-irrigation
git clone https://github.com/darikchandler-cell/vendure-hunterirrigation.git hunter-irrigation
cd hunter-irrigation
```

### Step 4: Configure Environment Variables

**IMPORTANT:** Set these before running deployment:

```bash
# Create .env files from examples
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env

# Edit with your values (use nano or vim)
nano .env
nano apps/api/.env
nano apps/storefront/.env
```

**Minimum required variables:**

**`.env`:**
```env
POSTGRES_PASSWORD=your-secure-password-here
COOKIE_SECRET=generate-random-32-char-string-here
```

**`apps/api/.env`:**
```env
DB_PASSWORD=your-secure-password-here
COOKIE_SECRET=generate-random-32-char-string-here
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

### Step 5: Run Deployment

```bash
chmod +x infra/deploy-to-server.sh
./infra/deploy-to-server.sh
```

The script will:
- Install dependencies
- Build applications
- Create Docker images
- Start all services
- Run migrations
- Create channels

### Step 6: Verify Deployment

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Test access
curl http://localhost
```

### Step 7: Access Your Sites

Once Caddy provisions SSL (automatic, may take 2-5 minutes):

- **Storefront (US):** https://hunterirrigationsupply.com
- **Storefront (CA):** https://hunterirrigation.ca
- **Admin UI:** https://hunterirrigationsupply.com/admin
- **Shop API:** https://hunterirrigationsupply.com/shop-api

## Troubleshooting

### If services won't start:

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs vendure-api
docker compose logs storefront
docker compose logs caddy
```

### If database connection fails:

```bash
# Check PostgreSQL
docker compose ps postgres
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U vendure -d vendure
```

### If Caddy SSL fails:

```bash
# Check Caddy logs
docker compose logs caddy

# Verify DNS
dig hunterirrigationsupply.com
dig hunterirrigation.ca

# Both should point to 178.156.194.89
```

### If port conflicts:

```bash
# Check what's using ports 80/443
sudo netstat -tulpn | grep -E ':(80|443)'

# Stop conflicting services if needed
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx     # if Nginx is running
```

## Update Deployment

To update after code changes:

```bash
cd /opt/hunter-irrigation
git pull origin main
docker compose build
docker compose up -d

# Run migrations if needed
cd apps/api
pnpm run migration:run
```

## Useful Commands

```bash
# View all logs
docker compose logs -f

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

## Default Admin Credentials

⚠️ **CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN:**

- **Email:** admin@hunterirrigationsupply.com
- **Password:** superadmin

Login at: https://hunterirrigationsupply.com/admin

