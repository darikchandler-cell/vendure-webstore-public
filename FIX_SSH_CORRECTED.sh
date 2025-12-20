#!/bin/bash
# CORRECTED VERSION - Copy and paste this entire block into Hetzner Console
# This fixes all the syntax errors from the previous attempt

echo "🔧 Fixing SSH Configuration (Corrected)"
echo "========================================"

# Fix SSH config with correct syntax (no typos, no double slashes)
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config

# Restart SSH
systemctl restart sshd

# Verify
echo ""
echo "✅ SSH Configuration Updated"
echo "PasswordAuthentication: $(grep -E '^PasswordAuthentication' /etc/ssh/sshd_config | grep -v '^#' | tail -1)"
echo "PermitRootLogin: $(grep -E '^PermitRootLogin' /etc/ssh/sshd_config | grep -v '^#' | tail -1)"

echo ""
echo "✅ Done! You can now SSH with password."




