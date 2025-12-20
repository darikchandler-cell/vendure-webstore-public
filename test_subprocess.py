#!/usr/bin/env python3
import subprocess
import sys

# Test if subprocess works at all
try:
    result = subprocess.run(['echo', 'test'], capture_output=True, text=True)
    print(f"Subprocess works! Output: {result.stdout}")
    sys.exit(0)
except Exception as e:
    print(f"Subprocess failed: {e}")
    sys.exit(1)

