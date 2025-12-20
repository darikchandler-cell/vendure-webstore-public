#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')
os.chmod(expect_script, 0o755)

# Try using shell=True with explicit command
cmd = f'/usr/bin/expect "{expect_script}"'

print("Executing email setup...")
print(f"Command: {cmd}")

# Use shell=True but with explicit encoding
result = subprocess.run(
    cmd,
    shell=True,
    cwd=script_dir,
    timeout=600
)

sys.exit(result.returncode)

