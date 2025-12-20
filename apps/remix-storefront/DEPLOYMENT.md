# Remix Storefront Deployment Guide

## Docker Deployment

The Remix storefront is configured to deploy via Docker Compose.

### Prerequisites

1. Docker and Docker Compose installed
2. Environment variables configured
3. Caddy reverse proxy configured

### Environment Variables

Set these in your `.env` file or as environment variables:

```env
# Vendure API
VENDURE_API_URL=http://vendure-api:3000
PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com

# Channel Tokens
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2

# Session Secret (REQUIRED - generate with: openssl rand -base64 32)
SESSION_SECRET=your-secure-session-secret-here

# Node Environment
NODE_ENV=production
```

### Deployment Steps

1. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

2. **Build and start services**:
   ```bash
   docker-compose up -d --build remix-storefront
   ```

3. **Or rebuild all services**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

4. **Verify deployment**:
   ```bash
   # Check container status
   docker-compose ps

   # Check logs
   docker-compose logs -f remix-storefront

   # Test health endpoint
   curl http://localhost:8002
   ```

5. **Reload Caddy** (if needed):
   ```bash
   sudo systemctl reload caddy
   # Or if using Docker
   docker-compose restart caddy
   ```

### Testing

1. **Test US domain**:
   ```bash
   curl -H "Host: hunterirrigationsupply.com" http://localhost:8002
   ```

2. **Test CA domain**:
   ```bash
   curl -H "Host: hunterirrigation.ca" http://localhost:8002
   ```

3. **Check channel tokens**:
   - Visit `https://hunterirrigationsupply.com` in browser
   - Open DevTools → Network tab
   - Check GraphQL requests for `vendure-token` header
   - Should be: `e8feb84eb1c9a971babd442996f62ed2` (US)

### Troubleshooting

#### Container won't start

```bash
# Check logs
docker-compose logs remix-storefront

# Check if port is in use
lsof -i :8002

# Rebuild from scratch
docker-compose build --no-cache remix-storefront
```

#### Build fails

```bash
# Check build logs
docker-compose build remix-storefront

# Verify environment variables
docker-compose config
```

#### Channel detection not working

1. Verify Caddy is forwarding `Host` header correctly
2. Check environment variables are set
3. Check logs for channel detection:
   ```bash
   docker-compose logs remix-storefront | grep -i channel
   ```

### Production Checklist

- [ ] Environment variables set in `.env` or Docker environment
- [ ] `SESSION_SECRET` is secure (32+ characters)
- [ ] Channel tokens are correct
- [ ] Caddyfile routes both domains to port 8002
- [ ] Container health check passes
- [ ] Both domains accessible
- [ ] Channel tokens verified in browser DevTools
- [ ] SSL/HTTPS configured (via Cloudflare)

### Rollback

If deployment fails:

```bash
# Stop new container
docker-compose stop remix-storefront

# Restore previous version
docker-compose up -d storefront  # Use Next.js storefront as fallback
```

### Monitoring

```bash
# Watch logs
docker-compose logs -f remix-storefront

# Check resource usage
docker stats hunter-irrigation-remix-storefront

# Check health
docker-compose ps remix-storefront
```

