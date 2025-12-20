#!/bin/bash
# Setup script with default environment variables for development

export DB_HOST=${DB_HOST:-localhost}
export DB_NAME=${DB_NAME:-vendure}
export DB_USERNAME=${DB_USERNAME:-vendure}
export DB_PASSWORD=${DB_PASSWORD:-changeme}
export COOKIE_SECRET=${COOKIE_SECRET:-dev-secret-key}
export NODE_ENV=development

echo "Using database configuration:"
echo "  DB_HOST: $DB_HOST"
echo "  DB_NAME: $DB_NAME"
echo "  DB_USERNAME: $DB_USERNAME"
echo ""

pnpm run setup-mfa


