#!/usr/bin/env python3
import subprocess
import sys
import os

# Set environment to avoid encoding issues
env = os.environ.copy()
env['LC_ALL'] = 'C'
env['LANG'] = 'C'
env['PYTHONIOENCODING'] = 'utf-8'

script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'run_ssh_setup.py')

print("=" * 70)
print("EXECUTING EMAIL SETUP SCRIPT")
print("=" * 70)
print(f"Script: {script_path}")
print("=" * 70)

# Execute using subprocess with explicit encoding
result = subprocess.run(
    [sys.executable, script_path],
    cwd=os.path.dirname(os.path.abspath(__file__)),
    env=env,
    timeout=600
)

print("=" * 70)
print(f"Exit code: {result.returncode}")
print("=" * 70)

sys.exit(result.returncode)

