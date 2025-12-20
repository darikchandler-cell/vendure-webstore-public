#!/bin/bash
# Verify individual email addresses in SES
# Even if domains are verified, individual addresses may need verification

echo "Checking individual email address verification status..."

aws ses get-identity-verification-attributes \
  --identities orders@hunterirrigationsupply.com orders@hunterirrigation.ca \
  --region us-west-2 \
  --output json | jq -r '.VerificationAttributes | to_entries[] | "\(.key): \(.value.VerificationStatus)"'

echo ""
echo "If status is not 'Success', verify the addresses:"
echo "  aws ses verify-email-identity --email-address orders@hunterirrigationsupply.com --region us-west-2"
echo "  aws ses verify-email-identity --email-address orders@hunterirrigation.ca --region us-west-2"


