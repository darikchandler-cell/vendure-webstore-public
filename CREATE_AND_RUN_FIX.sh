#!/bin/bash
# Create this script on the server using echo, then run it

# Step 1: Create the fix script using echo
cat > /tmp/fix-all.sh << 'SCRIPTEND'
#!/bin/bash
echo "🔧 Fixing All Issues..."
echo "======================"

# 1. Enable password authentication
echo "1. Enabling password authentication..."
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd
echo "✅ Password login enabled!"

# 2. Add SSH key
echo ""
echo "2. Adding SSH key..."
mkdir -p ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIABbCpmJcHK5jYk70MeOcoFIEkAh1FOdlEw+Bl7Z4n9h vendure-fix-key' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo "✅ SSH key added!"

# 3. Start storefront
echo ""
echo "3. Starting storefront..."
systemctl start vendure-storefront
systemctl enable vendure-storefront
sleep 3
if systemctl is-active --quiet vendure-storefront; then
  echo "✅ Storefront is RUNNING!"
else
  echo "❌ Storefront failed to start"
  journalctl -u vendure-storefront -n 20 --no-pager
fi

# 4. Create superadmin
echo ""
echo "4. Creating superadmin..."
cd /opt/hunter-irrigation/apps/api
sudo -u vendure bash -c 'pnpm run seed' 2>&1 | tail -10

# 5. Test
echo ""
echo "5. Testing..."
systemctl is-active vendure-storefront && echo "✅ Storefront RUNNING" || echo "❌ Storefront FAILED"
curl -s -o /dev/null -w "Local: HTTP %{http_code}\n" http://localhost:3001

echo ""
echo "✅ All fixes complete!"
SCRIPTEND

# Step 2: Make it executable and run it
chmod +x /tmp/fix-all.sh
/tmp/fix-all.sh




