#!/usr/bin/env python3
import subprocess
import sys
import os

# Get the absolute path to the expect script
script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')

# Make sure it's executable
os.chmod(expect_script, 0o755)

# Use subprocess with shell=False to bypass shell encoding issues
# Spawn expect directly
print("Executing expect script via Python subprocess...")
print(f"Script: {expect_script}")

try:
    # Use shell=False to avoid any shell interpretation
    result = subprocess.run(
        ['/usr/bin/expect', expect_script],
        cwd=script_dir,
        timeout=600,
        check=False
    )
    sys.exit(result.returncode)
except FileNotFoundError:
    # Try without full path
    try:
        result = subprocess.run(
            ['expect', expect_script],
            cwd=script_dir,
            timeout=600,
            check=False
        )
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("ERROR: expect not found. Please install expect or run manually.")
        print(f"Manual command: expect {expect_script}")
        sys.exit(1)
except subprocess.TimeoutExpired:
    print("ERROR: Script timed out after 10 minutes")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

