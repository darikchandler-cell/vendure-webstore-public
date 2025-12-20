#!/usr/bin/env python3
import subprocess
import sys
import json

print("=" * 70)
print("CHECKING AWS SES STATUS")
print("=" * 70)

# Check if individual email addresses are verified
emails = [
    'orders@hunterirrigationsupply.com',
    'orders@hunterirrigation.ca',
    'darikchandler@gmail.com'  # Recipient - needs verification if in sandbox
]

print("\n1. Checking email address verification status...")
for email in emails:
    try:
        result = subprocess.run(
            ['aws', 'ses', 'get-identity-verification-attributes',
             '--identities', email,
             '--region', 'us-west-2',
             '--output', 'json'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            status = data.get('VerificationAttributes', {}).get(email, {}).get('VerificationStatus', 'Not Found')
            print(f"   {email}: {status}")
        else:
            print(f"   {email}: Error checking status")
            print(f"   {result.stderr}")
    except Exception as e:
        print(f"   {email}: Error - {e}")

print("\n2. Checking SES account sending status (sandbox mode)...")
try:
    result = subprocess.run(
        ['aws', 'ses', 'get-account-sending-enabled',
         '--region', 'us-west-2',
         '--output', 'json'],
        capture_output=True,
        text=True,
        timeout=30
    )
    
    if result.returncode == 0:
        data = json.loads(result.stdout)
        enabled = data.get('Enabled', False)
        if enabled:
            print("   ✅ Account is OUT of sandbox mode (can send to any email)")
        else:
            print("   ⚠️  Account is IN sandbox mode (can only send to verified emails)")
            print("   ⚠️  Recipient email (darikchandler@gmail.com) must be verified!")
    else:
        print(f"   Error: {result.stderr}")
except Exception as e:
    print(f"   Error checking account status: {e}")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print("\nIf SES is in sandbox mode, you need to verify the RECIPIENT email:")
print("  aws ses verify-email-identity --email-address darikchandler@gmail.com --region us-west-2")
print("\nIf individual email addresses aren't verified, verify them:")
print("  aws ses verify-email-identity --email-address orders@hunterirrigationsupply.com --region us-west-2")
print("  aws ses verify-email-identity --email-address orders@hunterirrigation.ca --region us-west-2")


