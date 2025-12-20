#!/bin/bash
# ONE-LINER FIX - Copy this entire line to Hetzner Console and run it

mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh && systemctl start vendure-storefront && systemctl enable vendure-storefront && cd /opt/hunter-irrigation && sudo -u vendure bash -c 'cd apps/api && pnpm run seed' && systemctl status vendure-storefront | head -5 && curl -I https://hunterirrigationsupply.com

