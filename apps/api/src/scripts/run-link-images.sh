#!/bin/bash
# Wrapper script to run link-s3-images with proper environment variables

cd "$(dirname "$0")/../../.." || exit 1

# Load environment variables
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Run the script
export NODE_ENV=production
pnpm run link-s3-images

