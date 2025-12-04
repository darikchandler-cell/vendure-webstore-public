# Quick Start: SES Testing & SSH/CLI Build

## 📧 Test SES Email Configuration

**One command to test and verify SES:**

```bash
ssh user@your-server-ip
cd /opt/hunter-irrigation
bash infra/test-ses-complete.sh
```

**What it does:**
- Configures SES SMTP credentials
- Tests SMTP connection
- Sends test emails from both US and CA channels
- Verifies everything works

**Check your email** (`darikchandler@gmail.com`) for two test emails after running.

## 🚀 Build Site via SSH/CLI Only

**One command to build everything:**

```bash
ssh user@your-server-ip
cd /opt/hunter-irrigation
bash infra/build-via-ssh.sh
```

**Or run directly via SSH:**

```bash
ssh user@your-server-ip "bash -s" < infra/build-via-ssh.sh
```

**What it does:**
- Installs Docker, Node.js, pnpm (if needed)
- Clones/updates repository
- Installs dependencies
- Builds API and Storefront
- Builds Docker images
- Starts all services
- Runs migrations
- Creates channels

**Safe to run multiple times** - script is idempotent.

## 📋 Files Created

1. **`infra/test-ses-complete.sh`** - Complete SES test script
2. **`infra/build-via-ssh.sh`** - Complete SSH/CLI build script
3. **`infra/SES_AND_BUILD_GUIDE.md`** - Detailed documentation

## ✅ Next Steps

1. **Test SES:** Run `bash infra/test-ses-complete.sh`
2. **Build Site:** Run `bash infra/build-via-ssh.sh`
3. **Verify:** Check `docker compose ps` and logs

For detailed instructions, see `infra/SES_AND_BUILD_GUIDE.md`.

