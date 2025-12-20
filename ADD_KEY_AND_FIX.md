# Add SSH Key and Fix Issues

## Step 1: Add SSH Key to Server

**Go to Hetzner Console:**
1. https://console.hetzner.cloud/
2. Login → Open **diamond-street-services**
3. Click **Console** tab
4. Paste this command:

```bash
mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh && echo '✅ Key added'
```

## Step 2: Fix All Issues

After adding the key, I can automatically fix everything. The key is ready at:
- Private key: `~/.ssh/hetzner_vendure`
- Public key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key`

Once the key is added, I'll be able to:
1. ✅ Start storefront service
2. ✅ Create superadmin user
3. ✅ Verify all services
4. ✅ Test endpoints

**Let me know when you've added the key, and I'll fix everything automatically!**




