#!/bin/bash

# Run this on your server to test order emails
# Copy and paste this entire script into Hetzner Console or SSH session

cd /opt/hunter-irrigation

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Run the order email test
echo ""
echo "🛒 Running order email test..."
echo ""
bash infra/test-order-emails.sh


