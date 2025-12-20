# Type These Commands in Hetzner Console

Since the console is in GUI/VNC mode, type these commands one at a time:

## Command 1: Create the fix script

Type this entire command (it creates a script file):

```
cat > /tmp/fix-all.sh << 'SCRIPTEND'
#!/bin/bash
echo "🔧 Fixing All Issues..."

# Enable password authentication
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd
echo "✅ Password login enabled!"

# Add SSH key
mkdir -p ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo "✅ SSH key added!"

# Start storefront
systemctl start vendure-storefront
systemctl enable vendure-storefront
sleep 3
systemctl is-active vendure-storefront && echo "✅ RUNNING" || echo "❌ FAILED"

# Create superadmin
cd /opt/hunter-irrigation/apps/api
sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10

# Test
curl -s -o /dev/null -w "Local: HTTP %{http_code}\n" http://localhost:3001
echo "✅ Done!"
SCRIPTEND
```

Press Enter after typing the above.

## Command 2: Make it executable and run

```
chmod +x /tmp/fix-all.sh && /tmp/fix-all.sh
```

This will execute all the fixes automatically!




