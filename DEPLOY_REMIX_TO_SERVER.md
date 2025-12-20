# Deploy Remix Storefront to Production Server

## 🚀 Quick Deploy Commands

### Option 1: Automated Full Stack Deployment (Recommended)

SSH to your server and run:

```bash
ssh user@your-server-ip
cd /opt/hunter-irrigation
git pull origin main
./infra/deploy-full-stack.sh
```

### Option 2: Ensure Remix is Deployed (Checks and Deploys if Needed)

```bash
ssh user@your-server-ip
cd /opt/hunter-irrigation
./infra/ensure-remix-deployed.sh
```

### Option 3: Use Existing Build Script (Includes Remix)

```bash
ssh user@your-server-ip "bash -s" < infra/build-via-ssh.sh
```

## 📋 Step-by-Step Manual Deployment

If you prefer manual control:

```bash
# 1. SSH to server
ssh user@your-server-ip

# 2. Navigate to project
cd /opt/hunter-irrigation

# 3. Pull latest code
git pull origin main

# 4. Stop services (optional, or just rebuild Remix)
docker-compose down

# 5. Rebuild Remix storefront
docker-compose build --no-cache remix-storefront

# 6. Start Remix storefront
docker-compose up -d remix-storefront

# 7. Check status
docker-compose ps remix-storefront

# 8. View logs
docker-compose logs -f remix-storefront

# 9. Reload Caddy
docker-compose restart caddy
```

## ✅ Verify Deployment

After deployment, verify:

1. **Container is running**:
   ```bash
   docker-compose ps remix-storefront
   ```

2. **Endpoint responds**:
   ```bash
   curl http://localhost:8002
   ```

3. **US Domain**:
   ```bash
   curl -H "Host: hunterirrigationsupply.com" http://localhost:8002
   ```

4. **CA Domain**:
   ```bash
   curl -H "Host: hunterirrigation.ca" http://localhost:8002
   ```

5. **In Browser**:
   - Visit: `https://hunterirrigationsupply.com`
   - Visit: `https://hunterirrigation.ca`
   - Open DevTools → Network → Check for `vendure-token` header

## 🔧 Troubleshooting

### Remix container won't start

```bash
# Check logs
docker-compose logs remix-storefront

# Check if port is in use
lsof -i :8002

# Rebuild from scratch
docker-compose build --no-cache remix-storefront
docker-compose up -d remix-storefront
```

### Build fails

```bash
# Check build logs
docker-compose build remix-storefront 2>&1 | tee build.log

# Verify Dockerfile
cat apps/remix-storefront/Dockerfile
```

### Caddy not routing

```bash
# Check Caddyfile
cat infra/caddy/Caddyfile | grep -A 5 "remix-storefront\|8002"

# Reload Caddy
docker-compose restart caddy

# Or if Caddy is systemd service
sudo systemctl reload caddy
```

## 📝 Environment Variables

Ensure `.env` file has:

```env
VENDURE_API_URL=http://vendure-api:3000
PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2
SESSION_SECRET=<your-secure-32-char-secret>
NODE_ENV=production
```

## 🎯 One-Line Deploy

```bash
ssh user@server "cd /opt/hunter-irrigation && git pull && docker-compose down && docker-compose build --no-cache remix-storefront && docker-compose up -d remix-storefront && docker-compose restart caddy"
```

## 📊 Expected Result

After successful deployment:

```
✅ Remix storefront container is running
✅ Remix storefront is responding on port 8002
✅ Caddy is configured for Remix storefront
✅ Caddy reloaded
```

---

**Ready to deploy?** Choose one of the options above!

