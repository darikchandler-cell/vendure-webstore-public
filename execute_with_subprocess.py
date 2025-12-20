#!/usr/bin/env python3
import subprocess
import sys
import os
import shutil

# Find Python executable
python_exe = shutil.which('python3') or shutil.which('python') or sys.executable
expect_exe = shutil.which('expect') or '/usr/bin/expect'

script_dir = os.path.dirname(os.path.abspath(__file__))
expect_script = os.path.join(script_dir, 'infra', 'setup-email-working.exp')
os.chmod(expect_script, 0o755)

print(f"Python: {python_exe}")
print(f"Expect: {expect_exe}")
print(f"Script: {expect_script}")

# Use subprocess.run with explicit executable
try:
    result = subprocess.run(
        [expect_exe, expect_script],
        cwd=script_dir,
        timeout=600,
        check=False
    )
    sys.exit(result.returncode)
except Exception as e:
    print(f"Error: {e}")
    # Fallback: try to execute via os.system
    import os
    cmd = f'{expect_exe} "{expect_script}"'
    exit_code = os.system(cmd)
    sys.exit(exit_code >> 8 if exit_code else 0)

