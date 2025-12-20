#!/usr/bin/env python3
import subprocess
import sys
import os

# Get the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
target_script = os.path.join(script_dir, 'run_ssh_setup.py')

# Execute the script using subprocess
print("Executing run_ssh_setup.py...")
print(f"Script path: {target_script}")

# Use subprocess.run with shell=False to bypass shell encoding
result = subprocess.run(
    [sys.executable, target_script],
    cwd=script_dir,
    timeout=600
)

sys.exit(result.returncode)

