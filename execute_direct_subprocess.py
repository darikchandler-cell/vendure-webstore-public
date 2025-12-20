#!/usr/bin/env python3
import subprocess
import sys
import os
import shutil

# Find Python executable
python_exe = shutil.which('python3') or shutil.which('python') or sys.executable
script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'run_ssh_setup.py')

print(f"Python: {python_exe}")
print(f"Script: {script_path}")
print("Executing...")

# Execute directly using subprocess with shell=False
result = subprocess.run(
    [python_exe, script_path],
    cwd=os.path.dirname(os.path.abspath(__file__)),
    timeout=600
)

sys.exit(result.returncode)

