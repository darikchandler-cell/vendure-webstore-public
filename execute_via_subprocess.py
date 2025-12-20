#!/usr/bin/env python3
import subprocess
import sys
import os

# Get current directory and script path
current_dir = os.getcwd()
script_path = os.path.join(current_dir, 'run_ssh_setup.py')

print(f"Current directory: {current_dir}")
print(f"Script path: {script_path}")
print(f"Python executable: {sys.executable}")
print("=" * 70)
print("EXECUTING EMAIL SETUP SCRIPT")
print("=" * 70)

# Execute using subprocess with explicit Python path
try:
    result = subprocess.run(
        [sys.executable, script_path],
        cwd=current_dir,
        timeout=600
    )
    print("=" * 70)
    print(f"Exit code: {result.returncode}")
    print("=" * 70)
    sys.exit(result.returncode)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)


