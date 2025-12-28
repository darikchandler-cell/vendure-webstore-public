# Automated Deployment Setup

This guide explains how to set up automated deployments using GitHub Actions.

## Prerequisites

- GitHub repository with Actions enabled
- SSH access to your production server
- SSH key pair for authentication

## Setup Steps

### 1. Generate SSH Key (if you don't have one)

On your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

### 2. Add Public Key to Server

```bash
# Copy the public key to your server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@178.156.194.89

# Or manually:
cat ~/.ssh/github_actions_deploy.pub | ssh root@178.156.194.89 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

1. **SERVER_HOST**: `178.156.194.89`
2. **SERVER_USER**: `root`
3. **SERVER_SSH_KEY**: Contents of your private key (`~/.ssh/github_actions_deploy`)

To get your private key:
```bash
cat ~/.ssh/github_actions_deploy
```

### 4. Test the Workflow

1. Go to Actions tab in GitHub
2. Select "Deploy to Production" workflow
3. Click "Run workflow" → "Run workflow"

## Workflow Types

### Full Deployment (`deploy.yml`)
- **Triggers**: Automatically on push to `main` branch, or manually
- **What it does**: Full deployment including all services
- **When to use**: Major changes, new features, or when you want everything rebuilt

### Storefront Only (`deploy-storefront-only.yml`)
- **Triggers**: Manual only
- **What it does**: Only rebuilds and restarts the storefront container
- **When to use**: Quick frontend changes (like Google Analytics updates, UI tweaks)
- **Time**: Much faster (~2-3 minutes vs 10-15 minutes)

## How It Works

1. **On push to main**: Full deployment runs automatically
2. **Manual trigger**: You can manually trigger either workflow from the Actions tab
3. **Deployment process**:
   - Pulls latest code from GitHub
   - Runs the deployment script on the server
   - Rebuilds Docker containers
   - Restarts services
   - Verifies deployment

## Security Notes

- SSH keys are stored as GitHub Secrets (encrypted)
- Private keys never appear in logs
- Only authorized users can trigger deployments
- Server access is restricted to the specific SSH key

## Troubleshooting

### Deployment fails with "Permission denied"
- Check that the SSH public key is in `~/.ssh/authorized_keys` on the server
- Verify the private key in GitHub Secrets matches the public key on server

### Deployment fails with "Connection refused"
- Check server is running: `ssh root@178.156.194.89`
- Verify firewall allows SSH (port 22)

### Container build fails
- Check server has enough disk space: `df -h`
- Check Docker is running: `docker ps`
- View logs: `docker compose logs`

## Manual Deployment (Fallback)

If automated deployment fails, you can always deploy manually:

```bash
ssh root@178.156.194.89 'cd /opt/hunter-irrigation && git pull origin main && ./infra/execute-deployment.sh'
```


