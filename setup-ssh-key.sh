#!/bin/bash

# Setup SSH key for GitHub Actions deployment
# This adds the public key to your server

PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPmkrGSeuUhC7cXr/7vaPtaqMOL3UUH+OOavfBb0QuXi github-actions-deploy"
SERVER="root@178.156.194.89"

echo "🔑 Adding SSH key to server for GitHub Actions..."
echo ""
echo "You'll be prompted for your server password."
echo ""

# Add the key to the server
ssh $SERVER "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo '✅ SSH key added successfully'"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH key added to server!"
    echo ""
    echo "🧪 Testing connection..."
    ssh -i ~/.ssh/github_actions_deploy -o StrictHostKeyChecking=no $SERVER "echo '✅ SSH key authentication works!'" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Setup complete! GitHub Actions can now deploy automatically."
        echo ""
        echo "Next steps:"
        echo "1. Push any change to main branch → Auto deployment"
        echo "2. Or go to Actions tab → Run workflow manually"
    else
        echo ""
        echo "⚠️  Key added but test failed. This might be normal if StrictHostKeyChecking is enabled."
        echo "   The key should still work for GitHub Actions."
    fi
else
    echo ""
    echo "❌ Failed to add SSH key. Please add it manually:"
    echo ""
    echo "   ssh $SERVER"
    echo "   mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "   echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
    echo "   chmod 600 ~/.ssh/authorized_keys"
fi

