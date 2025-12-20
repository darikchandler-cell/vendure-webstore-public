#!/bin/bash
# Setup script for production-ready storefront

echo "🚀 Setting up production-ready Vendure Storefront..."

# Install dependencies
echo "📦 Installing dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
    echo "✅ Installing test dependencies..."
    yarn add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
else
    npm install
    echo "✅ Installing test dependencies..."
    npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "⚠️  Please update .env with your actual values!"
    else
        echo "⚠️  .env.template not found. Creating basic .env..."
        cat > .env << EOF
# Vendure API Configuration
VENDURE_API_URL=https://readonlydemo.vendure.io/shop-api
PUBLIC_VENDURE_API_URL=https://readonlydemo.vendure.io

# Channel Tokens (for multi-channel support)
# US_CHANNEL_TOKEN=your-us-channel-token
# CA_CHANNEL_TOKEN=your-ca-channel-token

# Session Security (REQUIRED IN PRODUCTION)
# Generate with: openssl rand -base64 32
SESSION_SECRET=change-this-in-production

# Node Environment
NODE_ENV=development
EOF
    fi
else
    echo "✅ .env file already exists"
fi

# Generate GraphQL types
echo "🔧 Generating GraphQL types..."
if command -v yarn &> /dev/null; then
    yarn generate
else
    npm run generate
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your actual values (especially SESSION_SECRET for production)"
echo "2. Update legal pages in app/routes/ (privacy.tsx, terms.tsx, returns.tsx)"
echo "3. Run 'yarn dev' or 'npm run dev' to start development server"
echo "4. See PRODUCTION_READINESS.md for deployment checklist"

