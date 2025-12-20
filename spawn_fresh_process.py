#!/usr/bin/env python3
import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')
os.chmod(expect_script, 0o755)

# Use subprocess.run with shell=False and full path to expect
# This completely bypasses shell interpretation
try:
    print("=" * 70)
    print("EMAIL SETUP - Executing via subprocess (bypassing shell)")
    print("=" * 70)
    print(f"Script: {expect_script}")
    print("=" * 70)
    
    result = subprocess.run(
        ['/usr/bin/expect', '-f', expect_script],
        cwd=script_dir,
        timeout=600,
        check=False
    )
    
    print("=" * 70)
    print(f"Exit code: {result.returncode}")
    print("=" * 70)
    
    sys.exit(result.returncode)
    
except FileNotFoundError:
    # Try without full path
    try:
        result = subprocess.run(
            ['expect', '-f', expect_script],
            cwd=script_dir,
            timeout=600,
            check=False
        )
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("ERROR: expect not found")
        print("Install with: brew install expect")
        print(f"Or run: expect {expect_script}")
        sys.exit(1)
except subprocess.TimeoutExpired:
    print("ERROR: Timeout after 10 minutes")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

