#!/usr/bin/env python3
# This script can be executed directly: ./EXECUTE_THIS.py
# It uses subprocess to bypass shell encoding issues
import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')

# Make executable
os.chmod(expect_script, 0o755)
os.chmod(__file__, 0o755)

print("=" * 70)
print("EMAIL SETUP - Bypassing shell encoding issues")
print("=" * 70)

# Execute expect directly using subprocess (bypasses shell)
result = subprocess.run(
    ['/usr/bin/expect', '-f', expect_script],
    cwd=script_dir,
    timeout=600
)

sys.exit(result.returncode)

