# Quick Start - Deploy to Your Server

Your server: **178.156.194.89** (diamond-street-services)
Domains configured: ✅ `hunterirrigationsupply.com` and `hunterirrigation.ca`

## Option 1: Transfer Code via rsync (Recommended)

From your **local machine**:

```bash
# Make sure you have SSH access to the server
ssh root@178.156.194.89

# From the project root, transfer files
cd /Users/workstationa/Library/CloudStorage/OneDrive-Personal/Cursor/vendure-sites
./infra/transfer-to-server.sh root
```

Then on the server:

```bash
cd /opt/hunter-irrigation
./infra/deploy-to-server.sh
```

## Option 2: Use Git (If you have a repository)

On the server:

```bash
# Install git if needed
sudo apt update && sudo apt install -y git

# Clone your repository
sudo mkdir -p /opt/hunter-irrigation
sudo chown $USER:$USER /opt/hunter-irrigation
cd /opt
git clone <your-repo-url> hunter-irrigation
cd hunter-irrigation

# Run deployment
./infra/deploy-to-server.sh
```

## Option 3: Manual Transfer

1. **Create a tarball locally:**
```bash
cd /Users/workstationa/Library/CloudStorage/OneDrive-Personal/Cursor/vendure-sites
tar --exclude='node_modules' --exclude='.git' --exclude='.next' --exclude='dist' \
    -czf vendure-sites.tar.gz .
```

2. **Transfer to server:**
```bash
scp vendure-sites.tar.gz root@178.156.194.89:/tmp/
```

3. **On the server:**
```bash
ssh root@178.156.194.89
cd /opt
mkdir -p hunter-irrigation
cd hunter-irrigation
tar -xzf /tmp/vendure-sites.tar.gz
./infra/deploy-to-server.sh
```

## After Deployment

1. **Configure environment variables** (IMPORTANT):
   - Edit `.env`, `apps/api/.env`, and `apps/storefront/.env`
   - Set secure passwords and tokens

2. **Restart services:**
```bash
docker compose down
docker compose up -d
```

3. **Access your sites:**
   - https://hunterirrigationsupply.com
   - https://hunterirrigation.ca
   - https://hunterirrigationsupply.com/admin

## What the Deployment Script Does

1. ✅ Installs Docker, Node.js, pnpm
2. ✅ Installs project dependencies
3. ✅ Builds applications
4. ✅ Creates Docker images
5. ✅ Starts all services
6. ✅ Runs database migrations
7. ✅ Creates channels (US & CA)
8. ✅ Optionally seeds initial data

## Troubleshooting

**Can't connect to server?**
```bash
# Test SSH connection
ssh root@178.156.194.89

# If you need to set up SSH keys:
ssh-copy-id root@178.156.194.89
```

**Services not starting?**
```bash
# Check logs
docker compose logs

# Check service status
docker compose ps
```

**Need to see detailed deployment guide?**
See `DEPLOY_NOW.md` for step-by-step instructions.

