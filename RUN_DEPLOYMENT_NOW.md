# 🚀 Deploy Full Stack (Option #3)

## Quick Deploy Command

Run this on your **production server**:

```bash
cd /path/to/vendure-sites
./infra/deploy-full-stack.sh
```

## What It Does

1. ✅ Stops all services (`docker-compose down`)
2. ✅ Pulls latest code from GitHub
3. ✅ Rebuilds all services including Remix storefront
4. ✅ Starts all services (`docker-compose up -d`)
5. ✅ Checks health of all services
6. ✅ Tests endpoints

## Manual Alternative

If you prefer to run manually:

```bash
# 1. Stop all services
docker-compose down

# 2. Pull latest code
git pull origin main

# 3. Rebuild all services
docker-compose build --no-cache

# 4. Start all services
docker-compose up -d

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f remix-storefront
```

## Services Deployed

- ✅ PostgreSQL
- ✅ Redis
- ✅ Vendure API
- ✅ Vendure Worker
- ✅ Next.js Storefront (port 3001)
- ✅ **Remix Storefront (port 8002)** ← NEW
- ✅ Caddy (reverse proxy)

## Verify Deployment

After deployment, test:

1. **Remix Storefront**:
   ```bash
   curl http://localhost:8002
   ```

2. **US Domain**:
   ```bash
   curl -H "Host: hunterirrigationsupply.com" http://localhost:8002
   ```

3. **CA Domain**:
   ```bash
   curl -H "Host: hunterirrigation.ca" http://localhost:8002
   ```

4. **In Browser**:
   - Visit: `https://hunterirrigationsupply.com`
   - Visit: `https://hunterirrigation.ca`
   - Check DevTools → Network → Verify `vendure-token` header

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs [service-name]

# Check all logs
docker-compose logs
```

### Remix storefront not responding
```bash
# Check Remix logs
docker-compose logs remix-storefront

# Check if port is available
lsof -i :8002

# Rebuild just Remix
docker-compose build --no-cache remix-storefront
docker-compose up -d remix-storefront
```

### Caddy not routing
```bash
# Reload Caddy
docker-compose restart caddy

# Or if running as systemd service
sudo systemctl reload caddy
```

## Environment Variables

Make sure your `.env` file has:

```env
VENDURE_API_URL=http://vendure-api:3000
PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2
SESSION_SECRET=<your-secure-secret>
NODE_ENV=production
```

## Expected Output

After running the script, you should see:

```
✅ postgres is running
✅ redis is running
✅ vendure-api is running
✅ vendure-worker is running
✅ storefront is running
✅ remix-storefront is running
✅ caddy is running
✅ Remix storefront responding on port 8002
✅ Next.js storefront responding on port 3001
✅ Vendure API responding on port 3000
🎉 Deployment complete!
```

## Rollback

If something goes wrong:

```bash
# Stop new services
docker-compose stop remix-storefront

# Restore previous deployment
git checkout HEAD~1
docker-compose up -d --build
```

---

**Ready to deploy?** Run: `./infra/deploy-full-stack.sh`

