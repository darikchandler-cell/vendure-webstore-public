# Start Storefront - Quick Guide

## 🚀 Quick Start (3 Commands)

Copy and paste these commands in your **Hetzner Console**:

```bash
systemctl start vendure-storefront
systemctl enable vendure-storefront
systemctl status vendure-storefront
```

## 📋 How to Access Hetzner Console

1. Go to: https://console.hetzner.cloud/
2. Login to your account
3. Click on: **diamond-street-services**
4. Click the **Console** tab
5. Paste the commands above

## ✅ Verify It Started

After running the commands, you should see:
- `Active: active (running)`
- No error messages

## 🧪 Test It

```bash
# Test locally
curl -I http://localhost:3001
# Should return: HTTP 200

# Test externally (wait 10 seconds first)
curl -I https://hunterirrigationsupply.com
# Should return: HTTP 200 (not 502)
```

## 🐛 If It Fails to Start

Check the logs:
```bash
journalctl -u vendure-storefront -n 50
```

Common issues:
- Build missing → Rebuild: `cd /opt/hunter-irrigation/apps/storefront && sudo -u vendure bash -c 'pnpm build'`
- Port in use → Check: `netstat -tuln | grep 3001`
- Environment missing → Check: `cat /opt/hunter-irrigation/.env | grep NEXT_PUBLIC`

## 📝 Complete Script

If you want to run the complete diagnostic script:

```bash
cd /opt/hunter-irrigation
bash infra/fix-storefront-only.sh
```

This will:
- Check current status
- View error logs
- Verify build exists
- Check environment
- Start the service
- Test the endpoint

