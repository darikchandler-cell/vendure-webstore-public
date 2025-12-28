#!/bin/bash
# Setup script for error reporting configuration
# This adds the GitHub token and error reporting configuration to .env

set -e

ENV_FILE="apps/api/.env"
GITHUB_TOKEN="REDACTED_GITHUB_TOKEN"

echo "🔧 Setting up error reporting configuration..."

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 Creating $ENV_FILE..."
  touch "$ENV_FILE"
fi

# Function to add or update env variable
add_or_update_env() {
  local key=$1
  local value=$2
  
  if grep -q "^${key}=" "$ENV_FILE"; then
    # Update existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      # Linux
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    fi
    echo "  ✅ Updated ${key}"
  else
    # Add new
    echo "" >> "$ENV_FILE"
    echo "# Error Reporting Configuration" >> "$ENV_FILE"
    echo "${key}=${value}" >> "$ENV_FILE"
    echo "  ✅ Added ${key}"
  fi
}

# Add error reporting configuration
echo "📧 Configuring error reporting..."
add_or_update_env "ERROR_REPORT_EMAIL" "darikchandler@gmail.com"
add_or_update_env "GITHUB_TOKEN" "$GITHUB_TOKEN"
add_or_update_env "GITHUB_OWNER" "darikchandler-cell"
add_or_update_env "GITHUB_REPO" "vendure-hunterirrigation"

echo ""
echo "✅ Error reporting configuration complete!"
echo ""
echo "📋 Configuration added:"
echo "   ERROR_REPORT_EMAIL=darikchandler@gmail.com"
echo "   GITHUB_TOKEN=REDACTED_GITHUB_TOKEN"
echo "   GITHUB_OWNER=darikchandler-cell"
echo "   GITHUB_REPO=vendure-hunterirrigation"
echo ""
echo "⚠️  SECURITY NOTE: The GitHub token is now in your .env file."
echo "   Make sure .env is in .gitignore and never commit it to git!"
echo ""
echo "🚀 Error reporting is now configured and ready to use!"
echo "   Restart your API server for changes to take effect."



