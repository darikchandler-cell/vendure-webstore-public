# Fix GitHub Actions SSH Authentication

## Problem
GitHub Actions deployment is failing with:
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain
```

## Root Cause
The SSH public key for GitHub Actions hasn't been added to the server's `authorized_keys` file.

## Solution

### Option 1: One-Line Command (Recommended)

SSH to your server and run this single command:

```bash
ssh root@178.156.194.89
```

Then paste this command:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPmkrGSeuUhC7cXr/7vaPtaqMOL3UUH+OOavfBb0QuXi github-actions-deploy" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "✅ SSH key added!"
```

### Option 2: Use the Script

1. Copy the script to your server:
```bash
scp infra/add-key-on-server.sh root@178.156.194.89:/tmp/
```

2. SSH to server and run:
```bash
ssh root@178.156.194.89
bash /tmp/add-key-on-server.sh
```

### Option 3: Manual Steps

1. SSH to your server:
```bash
ssh root@178.156.194.89
```

2. Run these commands:
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPmkrGSeuUhC7cXr/7vaPtaqMOL3UUH+OOavfBb0QuXi github-actions-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Verify It Works

After adding the key, test from your local machine:

```bash
ssh -i ~/.ssh/github_actions_deploy root@178.156.194.89 "echo '✅ SSH key works!'"
```

If this works, GitHub Actions will work too!

## Test GitHub Actions

Once the key is added:

1. Go to: https://github.com/darikchandler-cell/vendure-hunterirrigation/actions
2. Click "Deploy to Production" workflow
3. Click "Run workflow" → "Run workflow"
4. It should now succeed!

## What's Already Configured

✅ GitHub Secrets:
- `SERVER_HOST`: 178.156.194.89
- `SERVER_USER`: root  
- `SERVER_SSH_KEY`: Private key (correctly formatted)

✅ Workflows:
- "Deploy to Production" (auto on push to main)
- "Deploy Storefront Only" (manual trigger)

## After Fix

- Every push to `main` will automatically deploy
- Manual deployments via Actions tab
- Google Analytics changes will be deployed automatically

