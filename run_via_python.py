#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import subprocess
import sys
import os

# Set environment to avoid encoding issues
env = os.environ.copy()
env['LC_ALL'] = 'C'
env['LANG'] = 'C'

script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')

# Make executable
os.chmod(expect_script, 0o755)

print("=" * 60)
print("Executing email setup via expect script...")
print(f"Script: {expect_script}")
print("=" * 60)

try:
    # Use subprocess with explicit encoding and environment
    proc = subprocess.Popen(
        ['/usr/bin/expect', expect_script],
        cwd=script_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        universal_newlines=True
    )
    
    # Stream output in real-time
    for line in proc.stdout:
        print(line, end='')
    
    proc.wait()
    sys.exit(proc.returncode)
    
except FileNotFoundError:
    # Try without full path
    try:
        proc = subprocess.Popen(
            ['expect', expect_script],
            cwd=script_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True
        )
        for line in proc.stdout:
            print(line, end='')
        proc.wait()
        sys.exit(proc.returncode)
    except FileNotFoundError:
        print("ERROR: expect not found")
        print(f"Please run manually: expect {expect_script}")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

