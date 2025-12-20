# Deploy Remix Storefront - Quick Guide

## ✅ What's Ready

- ✅ Dockerfile created
- ✅ Docker Compose service configured
- ✅ Caddy routing configured
- ✅ Deployment script created
- ✅ All changes pushed to GitHub

## 🚀 Deploy Now

### Option 1: Automated Deployment Script

```bash
# From monorepo root
./infra/deploy-remix-storefront.sh
```

This script will:
- Validate environment variables
- Build the Remix storefront
- Start the container
- Check health
- Reload Caddy

### Option 2: Manual Docker Compose

```bash
# Build and start
docker-compose up -d --build remix-storefront

# Check status
docker-compose ps remix-storefront

# View logs
docker-compose logs -f remix-storefront
```

### Option 3: Full Stack Deployment

```bash
# Rebuild all services including Remix
docker-compose down
docker-compose up -d --build

# Reload Caddy
docker-compose restart caddy
```

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] `.env` file exists with required variables:
  ```env
  VENDURE_API_URL=http://vendure-api:3000
  PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
  US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
  CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2
  SESSION_SECRET=<secure-32-char-secret>
  NODE_ENV=production
  ```

- [ ] Caddyfile is updated (already done ✅)
- [ ] Port 8002 is available
- [ ] Vendure API is running

## 🧪 Verify Deployment

1. **Check container status**:
   ```bash
   docker-compose ps remix-storefront
   ```

2. **Test local endpoint**:
   ```bash
   curl http://localhost:8002
   ```

3. **Test US domain**:
   ```bash
   curl -H "Host: hunterirrigationsupply.com" http://localhost:8002
   ```

4. **Test CA domain**:
   ```bash
   curl -H "Host: hunterirrigation.ca" http://localhost:8002
   ```

5. **Check in browser**:
   - Visit: `https://hunterirrigationsupply.com`
   - Visit: `https://hunterirrigation.ca`
   - Open DevTools → Network tab
   - Verify `vendure-token` header in GraphQL requests

## 📊 Service Configuration

| Service | Port | Container Name |
|---------|------|----------------|
| Remix Storefront | 8002 | hunter-irrigation-remix-storefront |
| Next.js Storefront | 3001 | hunter-irrigation-storefront |
| Vendure API | 3000 | hunter-irrigation-api |
| Caddy | 80/443 | hunter-irrigation-caddy |

## 🔧 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs remix-storefront

# Rebuild from scratch
docker-compose build --no-cache remix-storefront
```

### Port conflict
```bash
# Check what's using port 8002
lsof -i :8002

# Kill process or change port in docker-compose.yml
```

### Build fails
```bash
# Check build logs
docker-compose build remix-storefront 2>&1 | tee build.log

# Verify Dockerfile syntax
docker build -t test-remix ./apps/remix-storefront
```

### Channel detection not working
1. Verify Caddy forwards `Host` header
2. Check environment variables
3. Check logs: `docker-compose logs remix-storefront | grep channel`

## 📝 Files Changed

- ✅ `apps/remix-storefront/Dockerfile` - Docker build configuration
- ✅ `docker-compose.yml` - Added remix-storefront service
- ✅ `infra/caddy/Caddyfile` - Routes both domains to port 8002
- ✅ `infra/deploy-remix-storefront.sh` - Deployment script
- ✅ `apps/remix-storefront/DEPLOYMENT.md` - Full deployment guide

## 🎯 Quick Deploy Command

```bash
# One command to deploy everything
cd /path/to/vendure-sites && \
  git pull origin main && \
  ./infra/deploy-remix-storefront.sh
```

## ✨ Summary

The Remix storefront is now ready to deploy! All configuration is in place:

- ✅ Docker configuration
- ✅ Environment variables
- ✅ Caddy routing
- ✅ Channel detection
- ✅ Deployment scripts

**Just run**: `./infra/deploy-remix-storefront.sh`

