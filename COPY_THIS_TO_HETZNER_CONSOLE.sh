#!/bin/bash
# COPY THIS ENTIRE FILE TO HETZNER CONSOLE AND RUN IT
# This will fix everything in one go

mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh && echo '✅ SSH key added' && systemctl start vendure-storefront && systemctl enable vendure-storefront && cd /opt/hunter-irrigation && sudo -u vendure bash -c 'cd apps/api && pnpm run seed' && systemctl status vendure-storefront | head -10 && curl -s -o /dev/null -w "Storefront: HTTP %{http_code}\n" http://localhost:3001 && echo "" && echo "✅ Fix complete! Both storefronts should now work."




