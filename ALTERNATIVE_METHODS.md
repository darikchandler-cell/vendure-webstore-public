# Alternative Methods to Fix Password Login

## Method 1: Single One-Liner (Easiest)

Type this ONE command in Hetzner Console:

```
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/; s/PasswordAuthentication no/PasswordAuthentication yes/; s/#PermitRootLogin prohibit-password/PermitRootLogin yes/; s/PermitRootLogin prohibit-password/PermitRootLogin yes/; s/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config && systemctl restart sshd && echo 'Done!'
```

## Method 2: Use Hetzner Web Console File Upload

1. Go to Hetzner Console
2. Look for "File Manager" or "Upload" option
3. Upload a small script file
4. Execute it

## Method 3: Use Hetzner API (if available)

The Hetzner API might support executing commands directly. Let me check...

## Method 4: Reset Password via Hetzner Dashboard

1. Go to Hetzner Cloud Dashboard
2. Click on diamond-street-services server
3. Look for "Reset Root Password" or "Access" options
4. Reset the password to a new one

## Method 5: Use Rescue Mode

1. Enable rescue mode in Hetzner Dashboard
2. Boot into rescue mode
3. Mount the disk and edit SSH config
4. Reboot normally

## Method 6: Create Script via Echo

Type this to create a script file, then run it:

```
cat > /tmp/fix-ssh.sh << 'EOF'
sed -i 's/#PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin no/PermitRootLogin yes/' /etc/ssh/sshd_config
systemctl restart sshd
echo 'Done!'
EOF
chmod +x /tmp/fix-ssh.sh
/tmp/fix-ssh.sh
```




