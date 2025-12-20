#!/usr/bin/env ts-node
/**
 * Pre-Launch Verification Script
 * 
 * Runs all pre-launch checks to ensure production readiness
 * Run this before deployment: yarn pre-launch:check
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const checks: CheckResult[] = [];

function runCheck(name: string, checkFn: () => boolean, message: string) {
  try {
    const passed = checkFn();
    checks.push({ name, passed, message });
    if (passed) {
      log(`  ✓ ${name}`, 'green');
    } else {
      log(`  ✗ ${name}: ${message}`, 'red');
    }
  } catch (error) {
    checks.push({ name, passed: false, message: error instanceof Error ? error.message : 'Unknown error' });
    log(`  ✗ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
  }
}

function main() {
  log('\n🚀 Pre-Launch Verification Checklist\n', 'cyan');
  log('=' .repeat(50), 'cyan');

  // 1. Environment Variables
  log('\n1. Environment Variables', 'blue');
  try {
    execSync('ts-node scripts/verify-env.ts', { stdio: 'inherit' });
    checks.push({ name: 'Environment Variables', passed: true, message: 'All environment variables validated' });
  } catch {
    checks.push({ name: 'Environment Variables', passed: false, message: 'Environment validation failed' });
  }

  // 2. Security Headers
  log('\n2. Security Headers', 'blue');
  try {
    execSync('ts-node scripts/verify-security-headers.ts', { stdio: 'inherit' });
    checks.push({ name: 'Security Headers', passed: true, message: 'Security headers configured' });
  } catch {
    checks.push({ name: 'Security Headers', passed: false, message: 'Security headers check failed' });
  }

  // 3. Build Check
  log('\n3. Production Build', 'blue');
  runCheck(
    'Production Build',
    () => {
      try {
        execSync('npm run build', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    'Build failed - run "npm run build" to see errors'
  );

  // 4. TypeScript Check
  log('\n4. TypeScript Compilation', 'blue');
  runCheck(
    'TypeScript',
    () => {
      try {
        execSync('tsc --noEmit', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    'TypeScript errors found - run "tsc --noEmit" to see errors'
  );

  // 5. Tests
  log('\n5. Tests', 'blue');
  runCheck(
    'Unit Tests',
    () => {
      try {
        execSync('npm run test -- --run', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    'Tests failed - run "npm run test" to see failures'
  );

  // 6. Legal Pages
  log('\n6. Legal Pages', 'blue');
  const legalPages = ['privacy.tsx', 'terms.tsx', 'returns.tsx'];
  legalPages.forEach(page => {
    runCheck(
      `Legal Page: ${page}`,
      () => existsSync(join(process.cwd(), 'app', 'routes', page)),
      `Missing ${page}`
    );
  });

  // 7. Cookie Consent
  log('\n7. Cookie Consent', 'blue');
  runCheck(
    'Cookie Consent Component',
    () => existsSync(join(process.cwd(), 'app', 'components', 'CookieConsent.tsx')),
    'CookieConsent component not found'
  );

  // 8. Environment Template
  log('\n8. Documentation', 'blue');
  runCheck(
    'Environment Template',
    () => existsSync(join(process.cwd(), '.env.template')) || existsSync(join(process.cwd(), '.env.example')),
    'Environment template file not found'
  );

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('\n📊 Summary\n', 'cyan');

  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  const failed = checks.filter(c => !c.passed);

  log(`Total Checks: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed.length}`, failed.length > 0 ? 'red' : 'green');

  if (failed.length > 0) {
    log('\n❌ Failed Checks:', 'red');
    failed.forEach(check => {
      log(`  - ${check.name}: ${check.message}`, 'red');
    });
  }

  log('\n📝 Manual Verification Required:', 'yellow');
  log('  - [ ] Test cookie consent banner functionality', 'yellow');
  log('  - [ ] Verify security headers in browser dev tools', 'yellow');
  log('  - [ ] Test error monitoring (if enabled)', 'yellow');
  log('  - [ ] Run Lighthouse audit', 'yellow');
  log('  - [ ] Test on mobile devices', 'yellow');
  log('  - [ ] Complete checkout flow', 'yellow');
  log('  - [ ] Test payment processing', 'yellow');
  log('  - [ ] Test user registration and login', 'yellow');
  log('  - [ ] Verify order history', 'yellow');

  if (failed.length > 0) {
    log('\n❌ Pre-launch checks failed. Please fix the issues above.', 'red');
    process.exit(1);
  } else {
    log('\n✨ All automated checks passed!', 'green');
    log('   Please complete the manual verification steps above.', 'yellow');
    process.exit(0);
  }
}

main();

