# Domain Configuration for Remix Storefront

## Overview

The Remix storefront is configured to run on two domains:
- **hunterirrigationsupply.com** → US Channel
- **hunterirrigation.ca** → CA Channel

## Channel Detection

The storefront automatically detects the channel based on the request hostname:

```typescript
// app/utils/channel-detection.ts
export function detectChannel(request: Request): ChannelCode {
  const hostname = new URL(request.url).hostname.toLowerCase();
  
  // Check for Canadian domain (hunterirrigation.ca)
  if (hostname === 'hunterirrigation.ca' || hostname.endsWith('.hunterirrigation.ca')) {
    return 'ca';
  }
  
  // Default to US channel (hunterirrigationsupply.com)
  // This will also handle localhost and other development domains
  return 'us';
}
```

### Domain Mapping

| Domain | Channel | Token | Port |
|--------|---------|-------|------|
| `hunterirrigationsupply.com` | US | `US_CHANNEL_TOKEN` | 8002 |
| `www.hunterirrigationsupply.com` | US | `US_CHANNEL_TOKEN` | 8002 |
| `hunterirrigation.ca` | CA | `CA_CHANNEL_TOKEN` | 8002 |
| `www.hunterirrigation.ca` | CA | `CA_CHANNEL_TOKEN` | 8002 |
| `localhost` (dev) | US (default) | `US_CHANNEL_TOKEN` | 8002 |

## Caddy Configuration

The Caddy reverse proxy routes both domains to the Remix storefront on port 8002:

### US Domain (hunterirrigationsupply.com)
```caddy
http://hunterirrigationsupply.com, http://www.hunterirrigationsupply.com {
  # ... security headers ...
  
  # Remix Storefront
  handle /build/* {
    reverse_proxy localhost:8002
  }
  
  handle {
    reverse_proxy localhost:8002
  }
}
```

### CA Domain (hunterirrigation.ca)
```caddy
http://hunterirrigation.ca, http://www.hunterirrigation.ca {
  # ... security headers ...
  
  # Remix Storefront
  handle /build/* {
    reverse_proxy localhost:8002
  }
  
  handle {
    reverse_proxy localhost:8002
  }
}
```

## Environment Variables

### Development
```env
VENDURE_API_URL=http://localhost:3000
PUBLIC_VENDURE_API_URL=http://localhost:3000
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2
NODE_ENV=development
```

### Production
```env
VENDURE_API_URL=https://hunterirrigationsupply.com
PUBLIC_VENDURE_API_URL=https://hunterirrigationsupply.com
US_CHANNEL_TOKEN=e8feb84eb1c9a971babd442996f62ed2
CA_CHANNEL_TOKEN=829a8999792172126c5af5458a47caa2
NODE_ENV=production
SESSION_SECRET=<generated-secret>
```

## How It Works

1. **Request arrives** at Caddy with domain `hunterirrigationsupply.com` or `hunterirrigation.ca`
2. **Caddy routes** to Remix storefront on port 8002
3. **Remix detects channel** from the `Host` header
4. **Channel token added** to GraphQL requests automatically
5. **Vendure processes** request with correct channel context

## Testing

### Test US Channel
```bash
# Visit in browser
https://hunterirrigationsupply.com

# Check Network tab in DevTools
# Verify vendure-token header: e8feb84eb1c9a971babd442996f62ed2
```

### Test CA Channel
```bash
# Visit in browser
https://hunterirrigation.ca

# Check Network tab in DevTools
# Verify vendure-token header: 829a8999792172126c5af5458a47caa2
```

### Local Development
```bash
# Add to /etc/hosts
127.0.0.1 hunterirrigationsupply.com
127.0.0.1 hunterirrigation.ca

# Start Remix storefront
pnpm --filter @hunter-irrigation/remix-storefront dev

# Visit
http://hunterirrigationsupply.com:8002  # US channel
http://hunterirrigation.ca:8002         # CA channel
```

## Port Configuration

The Remix storefront runs on port **8002** by default (configured in `remix.config.js`).

To change the port:
1. Update `remix.config.js` → `devServerPort: 8002`
2. Update Caddyfile → `reverse_proxy localhost:8002`
3. Update Docker compose (if using) → `ports: "8002:8002"`

## Troubleshooting

### Channel Not Detected Correctly

1. **Check hostname**: Verify the `Host` header in browser DevTools
2. **Check channel detection**: Add logging in `detectChannel()` function
3. **Verify environment**: Ensure channel tokens are set correctly

### Port Conflicts

If port 8002 is in use:
```bash
# Find process using port
lsof -i :8002

# Kill process or change port in remix.config.js
```

### Caddy Not Routing

1. **Reload Caddy**: `sudo systemctl reload caddy` or restart Caddy
2. **Check Caddyfile syntax**: `caddy validate --config /path/to/Caddyfile`
3. **Check Caddy logs**: `journalctl -u caddy -f`

## Production Deployment

1. **Set environment variables** in hosting platform
2. **Ensure Caddy is running** and configured
3. **Verify DNS** points to server
4. **Test both domains** after deployment
5. **Monitor logs** for channel detection issues

## Summary

✅ **hunterirrigationsupply.com** → US Channel → Port 8002  
✅ **hunterirrigation.ca** → CA Channel → Port 8002  
✅ Channel detection is automatic based on hostname  
✅ Channel tokens are added to all GraphQL requests  
✅ Caddy routes both domains to Remix storefront

