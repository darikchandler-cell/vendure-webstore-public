#!/bin/bash
# Add SSH key and fix everything in one go
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key"

mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "$PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ SSH key added"

systemctl start vendure-storefront
systemctl enable vendure-storefront
cd /opt/hunter-irrigation && sudo -u vendure bash -c 'cd apps/api && pnpm run seed'
systemctl status vendure-storefront | head -10
curl -s -o /dev/null -w "Storefront: HTTP %{http_code}\n" http://localhost:3001
