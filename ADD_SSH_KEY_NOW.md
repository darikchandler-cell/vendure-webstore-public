# Add SSH Key to Server - Quick Guide

## Step 1: SSH to Your Server

```bash
ssh root@178.156.194.89
```

## Step 2: Run This One Command

Copy and paste this entire command:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPmkrGSeuUhC7cXr/7vaPtaqMOL3UUH+OOavfBb0QuXi github-actions-deploy" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo "✅ SSH key added successfully!"
```

## Step 3: Verify It Worked

Exit the server and test from your local machine:

```bash
exit
ssh -i ~/.ssh/github_actions_deploy root@178.156.194.89 "echo '✅ SSH key works! GitHub Actions can now deploy.'"
```

If you see "✅ SSH key works!", you're all set!

## Step 4: Test GitHub Actions

1. Go to: https://github.com/darikchandler-cell/vendure-hunterirrigation/actions
2. Click "Deploy to Production"
3. Click "Run workflow" → "Run workflow"
4. It should now succeed!

## What Happens Next

✅ **Automatic Deployments**: Every push to `main` will automatically deploy
✅ **Manual Deployments**: You can trigger deployments from the Actions tab
✅ **Google Analytics**: Will be deployed automatically with your next push

---

**The SSH Public Key to Add:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPmkrGSeuUhC7cXr/7vaPtaqMOL3UUH+OOavfBb0QuXi github-actions-deploy
```

