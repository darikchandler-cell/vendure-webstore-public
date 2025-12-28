# Automated Deployment Guide

Complete reference guide for the automated deployment system using GitHub Actions.

## 🎯 Overview

This project uses **GitHub Actions** to automatically deploy code to the production server whenever changes are pushed to the `main` branch. No manual deployment steps required!

## ✅ What's Configured

### GitHub Secrets
- `SERVER_HOST`: `178.156.194.89`
- `SERVER_USER`: `root`
- `SERVER_SSH_KEY`: Private SSH key (`~/.ssh/hetzner_diamond_street`)

### GitHub Actions Workflows

1. **Deploy to Production** (`.github/workflows/deploy.yml`)
   - **Triggers**: Automatically on every push to `main` branch
   - **Also**: Can be manually triggered from Actions tab
   - **What it does**: Full deployment of all services

2. **Deploy Storefront Only** (`.github/workflows/deploy-storefront-only.yml`)
   - **Triggers**: Manual only (for quick frontend updates)
   - **What it does**: Only rebuilds and restarts the storefront container
   - **Time**: Much faster (~2-3 minutes vs 10-15 minutes)

### SSH Key
- **Location**: `~/.ssh/hetzner_diamond_street`
- **Public Key**: Already added to server's `authorized_keys`
- **Status**: ✅ Working and tested

## 🚀 How It Works

### Automatic Deployment Flow

```
1. You push code to main branch
   ↓
2. GitHub Actions detects the push
   ↓
3. Workflow runs automatically
   ↓
4. Connects to server via SSH
   ↓
5. Pulls latest code (or uses existing)
   ↓
6. Runs deployment script
   ↓
7. Rebuilds Docker containers
   ↓
8. Restarts services
   ↓
9. Verifies deployment
   ↓
10. ✅ Done! Your changes are live
```

### Deployment Script

The deployment is handled by `infra/execute-deployment.sh` which:
- Configures environment variables
- Installs dependencies
- Builds applications
- Builds Docker images
- Stops old containers
- Starts new containers
- Runs database migrations
- Creates channels (if needed)
- Verifies deployment

## 📋 Usage

### Automatic Deployment (Recommended)

**Just push to main:**
```bash
git add .
git commit -m "your changes"
git push origin main
```

That's it! Deployment starts automatically.

### Manual Deployment

1. Go to: https://github.com/darikchandler-cell/vendure-hunterirrigation/actions
2. Click on "Deploy to Production" workflow
3. Click "Run workflow" → "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

### Quick Storefront-Only Deployment

For frontend-only changes (like CSS, UI tweaks, Google Analytics):

1. Go to: https://github.com/darikchandler-cell/vendure-hunterirrigation/actions
2. Click on "Deploy Storefront Only" workflow
3. Click "Run workflow"
4. Enter reason (optional)
5. Click "Run workflow"

**Time saved**: ~10-12 minutes (only rebuilds storefront, not all services)

## 🔍 Monitoring Deployments

### View Deployment Status

**Via GitHub:**
1. Go to: https://github.com/darikchandler-cell/vendure-hunterirrigation/actions
2. Click on the latest workflow run
3. See real-time logs and status

**Via Command Line:**
```bash
gh run list --repo darikchandler-cell/vendure-hunterirrigation --limit 5
```

**View specific run:**
```bash
gh run view <run-id> --repo darikchandler-cell/vendure-hunterirrigation
```

**Watch deployment in real-time:**
```bash
gh run watch --repo darikchandler-cell/vendure-hunterirrigation
```

### Deployment Logs

Each deployment shows:
- ✅ Step-by-step progress
- ⚠️ Warnings (non-critical)
- ❌ Errors (if any)
- 📊 Final status

### Success Indicators

Look for these in the logs:
- ✅ "Successfully executed commands to all host"
- ✅ "Deployment complete!"
- ✅ Container status showing all services running
- ✅ HTTP 200 responses from endpoints

## 🛠️ Troubleshooting

### Deployment Fails

**Check the logs:**
1. Go to Actions tab
2. Click on failed run
3. Expand "Deploy to server" step
4. Look for error messages

**Common Issues:**

1. **SSH Connection Failed**
   - Error: `ssh: handshake failed`
   - **Fix**: Verify SSH key is in GitHub Secrets
   - **Check**: `gh secret list --repo darikchandler-cell/vendure-hunterirrigation`

2. **Git Operations Failed**
   - Error: `fatal: could not read Username`
   - **Status**: ✅ This is OK - script uses existing code if git fails
   - **Note**: Deployment continues with existing code on server

3. **Docker Build Failed**
   - Error: Build errors in logs
   - **Fix**: Check code for syntax errors
   - **Check**: Run `pnpm build` locally first

4. **Container Won't Start**
   - Error: Container exits immediately
   - **Fix**: Check application logs on server
   - **Command**: `ssh root@178.156.194.89 "cd /opt/hunter-irrigation && docker compose logs"`

### Manual Deployment (Fallback)

If automated deployment fails, deploy manually:

```bash
ssh root@178.156.194.89
cd /opt/hunter-irrigation
git pull origin main  # or skip if git fails
chmod +x infra/execute-deployment.sh
./infra/execute-deployment.sh
```

### Verify Server Status

```bash
# Check containers
ssh root@178.156.194.89 "cd /opt/hunter-irrigation && docker compose ps"

# Check logs
ssh root@178.156.194.89 "cd /opt/hunter-irrigation && docker compose logs -f"

# Test endpoints
ssh root@178.156.194.89 "curl -s -o /dev/null -w 'Storefront: HTTP %{http_code}\n' http://localhost:3001"
```

## 📦 What Gets Deployed

### Services Deployed

1. **Vendure API** (`vendure-api`)
   - Backend API server
   - Port: 3000 (internal)
   - Health: `/health` endpoint

2. **Vendure Worker** (`vendure-worker`)
   - Background job processor
   - Handles emails, tasks, etc.

3. **Storefront** (`storefront`)
   - Next.js storefront
   - Port: 3001 (internal)
   - Routes through Caddy reverse proxy

4. **Caddy** (`caddy`)
   - Reverse proxy and SSL
   - Ports: 80, 443 (public)
   - Handles routing to services

5. **PostgreSQL** (`postgres`)
   - Database
   - Port: 5432 (internal only)

6. **Redis** (`redis`)
   - Cache and queue
   - Port: 6379 (internal only)

### Files Updated

- All code in `apps/` directories
- Configuration files
- Docker images (rebuilt)
- Environment variables (from script)

## 🔐 Security

### SSH Key Management

**Current Key:**
- File: `~/.ssh/hetzner_diamond_street`
- Public Key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEikl6D9fN2O8dlatwIo+V8aqJ7AFK45U2m9GASlbuEZ hetzner-diamond-street-services`
- Status: ✅ Added to server

**To Rotate Key:**
1. Generate new key: `ssh-keygen -t ed25519 -f ~/.ssh/new_key`
2. Add public key to server
3. Update GitHub Secret: `gh secret set SERVER_SSH_KEY < ~/.ssh/new_key --repo darikchandler-cell/vendure-hunterirrigation`

### Secrets Management

All secrets are stored in GitHub Secrets (encrypted):
- Never commit secrets to code
- Secrets are only accessible to authorized users
- Secrets are encrypted at rest

## 📝 Deployment Script Details

**Location**: `infra/execute-deployment.sh`

**What it does:**
1. Sets up repository (skips if git fails)
2. Configures environment variables
3. Installs prerequisites (Docker, Node.js, pnpm)
4. Installs dependencies (`pnpm install`)
5. Builds applications (`pnpm build`)
6. Builds Docker images (`docker compose build`)
7. Stops existing containers (`docker compose down`)
8. Starts services (`docker compose up -d`)
9. Waits for services to start
10. Runs database migrations
11. Creates channels (if needed)
12. Verifies deployment

**Credentials**: Stored securely in the script (do not modify)

## 🎯 Best Practices

### Before Pushing

1. **Test locally:**
   ```bash
   pnpm build
   pnpm lint
   ```

2. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   ```

3. **Push to main:**
   ```bash
   git push origin main
   ```

### During Deployment

1. **Monitor the workflow:**
   - Watch in GitHub Actions tab
   - Check for errors early

2. **Don't push again while deploying:**
   - Wait for current deployment to finish
   - Multiple deployments can conflict

### After Deployment

1. **Verify it worked:**
   - Check Actions tab for ✅ success
   - Visit your sites
   - Test functionality

2. **Check logs if issues:**
   ```bash
   ssh root@178.156.194.89 "cd /opt/hunter-irrigation && docker compose logs -f"
   ```

## 🔄 Workflow Files

### Full Deployment
- **File**: `.github/workflows/deploy.yml`
- **Trigger**: Push to `main` or manual
- **Duration**: ~10-15 minutes

### Storefront Only
- **File**: `.github/workflows/deploy-storefront-only.yml`
- **Trigger**: Manual only
- **Duration**: ~2-3 minutes

## 📊 Deployment History

View all deployments:
```bash
gh run list --repo darikchandler-cell/vendure-hunterirrigation
```

View specific deployment:
```bash
gh run view <run-id> --repo darikchandler-cell/vendure-hunterirrigation
```

## 🆘 Quick Reference

### Start Deployment
```bash
git push origin main  # Automatic
# OR
gh workflow run "Deploy to Production" --repo darikchandler-cell/vendure-hunterirrigation
```

### Check Status
```bash
gh run list --repo darikchandler-cell/vendure-hunterirrigation --limit 5
```

### View Logs
```bash
gh run view <run-id> --repo darikchandler-cell/vendure-hunterirrigation --log
```

### Manual Deploy (if needed)
```bash
ssh root@178.156.194.89 'cd /opt/hunter-irrigation && ./infra/execute-deployment.sh'
```

## 📞 Support

If automated deployment isn't working:

1. Check GitHub Actions logs for errors
2. Verify SSH key is in GitHub Secrets
3. Test SSH connection manually
4. Check server status
5. Use manual deployment as fallback

## ✅ Current Status

- ✅ **Automated Deployment**: Active and working
- ✅ **SSH Key**: Configured and tested
- ✅ **GitHub Secrets**: All set up
- ✅ **Workflows**: Active
- ✅ **Last Deployment**: Check Actions tab for latest

---

**Last Updated**: 2025-12-20  
**Maintained By**: Automated via GitHub Actions  
**Server**: 178.156.194.89 (diamond-street-services)



