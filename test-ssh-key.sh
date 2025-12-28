#!/bin/bash

# Test script to verify SSH key is working
# Run this AFTER adding the key to the server

echo "🧪 Testing SSH key for GitHub Actions..."
echo ""

if ssh -i ~/.ssh/github_actions_deploy -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@178.156.194.89 "echo '✅ SSH key authentication works!'" 2>/dev/null; then
    echo ""
    echo "🎉 SUCCESS! SSH key is working!"
    echo ""
    echo "✅ GitHub Actions can now deploy automatically"
    echo "✅ Every push to main will trigger a deployment"
    echo "✅ You can manually trigger deployments from the Actions tab"
    echo ""
    echo "Next steps:"
    echo "1. Go to: https://github.com/darikchandler-cell/vendure-hunterirrigation/actions"
    echo "2. Click 'Deploy to Production'"
    echo "3. Click 'Run workflow' → 'Run workflow'"
    echo "4. Your Google Analytics changes will deploy!"
    exit 0
else
    echo ""
    echo "❌ SSH key test failed"
    echo ""
    echo "The SSH key hasn't been added to the server yet."
    echo ""
    echo "Please:"
    echo "1. SSH to your server: ssh root@178.156.194.89"
    echo "2. Run the command from ADD_SSH_KEY_NOW.md"
    echo "3. Then run this test script again"
    exit 1
fi



