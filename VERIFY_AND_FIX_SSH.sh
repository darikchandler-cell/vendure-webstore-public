#!/bin/bash
# Run this in Hetzner Console to verify and fix SSH key

echo "🔍 Verifying SSH Key Setup"
echo "=========================="
echo ""

# Expected public key
EXPECTED_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key"

echo "1. Checking current authorized_keys..."
echo "======================================"
if [ -f ~/.ssh/authorized_keys ]; then
  echo "Current keys in authorized_keys:"
  cat ~/.ssh/authorized_keys
  echo ""
  
  if grep -q "vendure-fix-key" ~/.ssh/authorized_keys; then
    echo "✅ Found vendure-fix-key"
    FOUND_KEY=$(grep "vendure-fix-key" ~/.ssh/authorized_keys)
    echo "Found: $FOUND_KEY"
    echo "Expected: $EXPECTED_KEY"
    
    if [ "$FOUND_KEY" = "$EXPECTED_KEY" ]; then
      echo "✅ Keys match!"
    else
      echo "❌ Keys don't match - fixing..."
      # Remove old key
      sed -i '/vendure-fix-key/d' ~/.ssh/authorized_keys
      # Add correct key
      echo "$EXPECTED_KEY" >> ~/.ssh/authorized_keys
      echo "✅ Correct key added"
    fi
  else
    echo "❌ vendure-fix-key not found - adding..."
    echo "$EXPECTED_KEY" >> ~/.ssh/authorized_keys
    echo "✅ Key added"
  fi
else
  echo "❌ ~/.ssh/authorized_keys doesn't exist - creating..."
  mkdir -p ~/.ssh
  echo "$EXPECTED_KEY" >> ~/.ssh/authorized_keys
  echo "✅ Created and added key"
fi

echo ""
echo "2. Fixing permissions..."
echo "======================="
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
echo "✅ Permissions fixed"

echo ""
echo "3. Verifying final setup..."
echo "==========================="
echo "SSH directory permissions:"
ls -ld ~/.ssh
echo ""
echo "authorized_keys permissions:"
ls -l ~/.ssh/authorized_keys
echo ""
echo "Key content:"
grep "vendure-fix-key" ~/.ssh/authorized_keys || echo "❌ Key not found!"

echo ""
echo "4. Fixing storefront..."
echo "======================="
systemctl start vendure-storefront
systemctl enable vendure-storefront
sleep 3

if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING!"
else
  echo "❌ Storefront failed to start"
  journalctl -u vendure-storefront -n 20 --no-pager
fi

echo ""
echo "5. Creating superadmin..."
echo "========================="
cd /opt/hunter-irrigation/apps/api
sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10

echo ""
echo "6. Testing..."
echo "============"
systemctl is-active vendure-storefront && echo "✅ Storefront RUNNING" || echo "❌ Storefront FAILED"
curl -s -o /dev/null -w "Local: HTTP %{http_code}\n" http://localhost:3001

echo ""
echo "✅ Complete! SSH should now work with the private key."




