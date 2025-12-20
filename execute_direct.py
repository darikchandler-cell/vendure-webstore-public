#!/usr/bin/env python3
import os
import sys

# Get absolute paths
script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')

# Make executable
os.chmod(expect_script, 0o755)

# Use os.system which might bypass some encoding issues
cmd = f'/usr/bin/expect "{expect_script}"'
print(f"Executing: {cmd}")
exit_code = os.system(cmd)
sys.exit(exit_code >> 8 if exit_code else 0)

