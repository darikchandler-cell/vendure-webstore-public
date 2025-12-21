# Execute Remix Storefront Deployment

## 🚀 Deployment Commands

### Quick Deploy (Recommended)

Run this on your production server:

```bash
cd /opt/hunter-irrigation && \
git pull origin main && \
docker-compose down && \
docker-compose build --no-cache remix-storefront && \
docker-compose up -d remix-storefront && \
docker-compose restart caddy && \
docker-compose ps remix-storefront
```

### Full Stack Deploy

```bash
cd /opt/hunter-irrigation && \
git pull origin main && \
./infra/deploy-full-stack.sh
```

### Verify Deployment

```bash
cd /opt/hunter-irrigation && \
./infra/ensure-remix-deployed.sh
```

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] `.env` file exists with all required variables
- [ ] `SESSION_SECRET` is set (32+ characters)
- [ ] Channel tokens are correct
- [ ] Git repository is up to date
- [ ] Docker and Docker Compose are installed
- [ ] Port 8002 is available

## 📋 Deployment Steps

1. **SSH to Server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Navigate to Project**:
   ```bash
   cd /opt/hunter-irrigation
   ```

3. **Pull Latest Code**:
   ```bash
   git pull origin main
   ```

4. **Deploy Remix Storefront**:
   ```bash
   docker-compose build --no-cache remix-storefront
   docker-compose up -d remix-storefront
   ```

5. **Verify Deployment**:
   ```bash
   docker-compose ps remix-storefront
   docker-compose logs remix-storefront
   curl http://localhost:8002
   ```

6. **Reload Caddy**:
   ```bash
   docker-compose restart caddy
   ```

## 🧪 Post-Deployment Verification

### 1. Check Container Status
```bash
docker-compose ps remix-storefront
```
Should show: `Up` or `healthy`

### 2. Test Local Endpoint
```bash
curl http://localhost:8002
```
Should return HTML response

### 3. Test US Domain
```bash
curl -H "Host: hunterirrigationsupply.com" http://localhost:8002
```
Should return HTML with US channel content

### 4. Test CA Domain
```bash
curl -H "Host: hunterirrigation.ca" http://localhost:8002
```
Should return HTML with CA channel content

### 5. Browser Verification
- Visit: `https://hunterirrigationsupply.com`
- Open DevTools → Network tab
- Check GraphQL requests
- Verify `vendure-token` header: `e8feb84eb1c9a971babd442996f62ed2`

- Visit: `https://hunterirrigation.ca`
- Check GraphQL requests
- Verify `vendure-token` header: `829a8999792172126c5af5458a47caa2`

## 🔧 Troubleshooting

### Container Not Starting
```bash
# Check logs
docker-compose logs remix-storefront

# Check for errors
docker-compose logs remix-storefront | grep -i error

# Rebuild
docker-compose build --no-cache remix-storefront
docker-compose up -d remix-storefront
```

### Port Conflict
```bash
# Check what's using port 8002
sudo lsof -i :8002

# Kill process or change port in docker-compose.yml
```

### Build Fails
```bash
# Check build logs
docker-compose build remix-storefront 2>&1 | tee build.log

# Check Dockerfile
cat apps/remix-storefront/Dockerfile
```

### Caddy Not Routing
```bash
# Verify Caddyfile
grep -A 3 "8002" infra/caddy/Caddyfile

# Reload Caddy
docker-compose restart caddy

# Check Caddy logs
docker-compose logs caddy
```

## 📊 Expected Output

After successful deployment:

```
✅ Remix storefront container is running
✅ Remix storefront is responding on port 8002
✅ Caddy is configured for Remix storefront
✅ Services are healthy
```

## 🎯 One-Line Deploy Command

Copy and paste this entire command:

```bash
cd /opt/hunter-irrigation && git pull origin main && docker-compose down && docker-compose build --no-cache remix-storefront && docker-compose up -d remix-storefront && docker-compose restart caddy && sleep 10 && docker-compose ps remix-storefront && curl -s http://localhost:8002 | head -20
```

This will:
1. Pull latest code
2. Stop services
3. Build Remix storefront
4. Start Remix storefront
5. Reload Caddy
6. Check status
7. Test endpoint

---

**Ready to deploy?** Run the commands above on your production server!

