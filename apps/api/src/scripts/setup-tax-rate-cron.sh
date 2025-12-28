#!/bin/bash

# Setup Tax Rate Sync Cron Job
# This script sets up a cron job to run tax rate sync on January 1st every year
# and sends email notifications to orders@hollowventures.com

set -e

PROJECT_DIR="/opt/hunter-irrigation"
API_DIR="$PROJECT_DIR/apps/api"
SCRIPT_PATH="$API_DIR/src/scripts/sync-tax-rates-with-email.ts"
CRON_LOG="$API_DIR/logs/tax-rate-sync.log"
CRON_ERROR_LOG="$API_DIR/logs/tax-rate-sync-error.log"

echo "📅 Setting up Tax Rate Sync Cron Job"
echo "===================================="
echo ""

# Create logs directory
mkdir -p "$API_DIR/logs"
touch "$CRON_LOG" "$CRON_ERROR_LOG"
chmod 644 "$CRON_LOG" "$CRON_ERROR_LOG"

# Load environment variables from .env file
ENV_FILE="$API_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Warning: .env file not found at $ENV_FILE"
    echo "   Cron job will need environment variables set manually"
fi

# Create cron job script
CRON_SCRIPT="$API_DIR/scripts/run-tax-rate-sync.sh"
mkdir -p "$API_DIR/scripts"

cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash

# Tax Rate Sync Cron Job Runner
# Runs the tax rate sync script with proper environment variables

PROJECT_DIR="/opt/hunter-irrigation"
API_DIR="$PROJECT_DIR/apps/api"
SCRIPT_PATH="$API_DIR/src/scripts/sync-tax-rates-with-email.ts"
LOG_FILE="$API_DIR/logs/tax-rate-sync.log"
ERROR_LOG="$API_DIR/logs/tax-rate-sync-error.log"
ENV_FILE="$API_DIR/.env"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | grep -E "^[A-Z_]+=.+" | xargs)
fi

# Ensure required environment variables are set
if [ -z "$DB_HOST" ]; then
    export DB_HOST=localhost
fi
if [ -z "$DB_PORT" ]; then
    export DB_PORT=5432
fi
if [ -z "$DB_NAME" ]; then
    export DB_NAME=vendure
fi
if [ -z "$DB_USERNAME" ]; then
    export DB_USERNAME=vendure
fi
if [ -z "$COOKIE_SECRET" ]; then
    export COOKIE_SECRET=test-secret
fi

# Change to API directory
cd "$API_DIR"

# Run the sync script
echo "========================================" >> "$LOG_FILE"
echo "Tax Rate Sync Started: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

pnpm exec ts-node -r tsconfig-paths/register "$SCRIPT_PATH" >> "$LOG_FILE" 2>> "$ERROR_LOG"

EXIT_CODE=$?

echo "Tax Rate Sync Finished: $(date)" >> "$LOG_FILE"
echo "Exit Code: $EXIT_CODE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit $EXIT_CODE
EOF

chmod +x "$CRON_SCRIPT"
echo "✅ Created cron script: $CRON_SCRIPT"

# Remove existing cron job if it exists
crontab -l 2>/dev/null | grep -v "run-tax-rate-sync.sh" | crontab - 2>/dev/null || true

# Add new cron job (runs January 1st at 12:00 AM every year)
CRON_SCHEDULE="0 0 1 1 *"
CRON_JOB="$CRON_SCHEDULE $CRON_SCRIPT"

(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added:"
echo "   Schedule: January 1st, 12:00 AM (yearly)"
echo "   Script: $CRON_SCRIPT"
echo "   Log: $CRON_LOG"
echo "   Error Log: $CRON_ERROR_LOG"
echo ""

# Show current crontab
echo "📋 Current crontab:"
crontab -l | grep -A 2 -B 2 "run-tax-rate-sync" || echo "   (No matching entries found)"
echo ""

echo "✅ Tax rate sync cron job setup complete!"
echo ""
echo "💡 To test the job manually:"
echo "   $CRON_SCRIPT"
echo ""
echo "💡 To view logs:"
echo "   tail -f $CRON_LOG"
echo "   tail -f $CRON_ERROR_LOG"
echo ""
echo "💡 To remove the cron job:"
echo "   crontab -e"
echo "   (Remove the line with run-tax-rate-sync.sh)"



