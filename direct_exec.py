#!/usr/bin/env python3
import subprocess
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')
os.chmod(expect_script, 0o755)

# Try executing expect script directly using subprocess with shell=False
# This bypasses shell interpretation entirely
try:
    print("Attempting to execute expect script...")
    print(f"Working directory: {script_dir}")
    print(f"Script path: {expect_script}")
    
    # Execute with shell=False to avoid any shell encoding issues
    process = subprocess.Popen(
        ['/usr/bin/expect', '-f', expect_script],
        cwd=script_dir,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Wait for completion
    returncode = process.wait()
    sys.exit(returncode)
    
except FileNotFoundError:
    # Try without full path
    try:
        process = subprocess.Popen(
            ['expect', '-f', expect_script],
            cwd=script_dir,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        returncode = process.wait()
        sys.exit(returncode)
    except FileNotFoundError:
        print("ERROR: expect command not found")
        print("Please install expect: brew install expect")
        print(f"Or run manually: expect {expect_script}")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

