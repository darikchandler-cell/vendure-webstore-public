#!/usr/bin/env ts-node
/**
 * Security Headers Verification Script
 * 
 * Verifies that security headers are properly configured
 * Run this after deployment: yarn verify:security
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const REQUIRED_HEADERS = [
  'X-Frame-Options',
  'X-Content-Type-Options',
  'X-XSS-Protection',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Content-Security-Policy',
];

function checkNetlifyConfig() {
  log('\n🔍 Checking Netlify Configuration...\n', 'blue');
  
  try {
    const netlifyToml = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf-8');
    
    const foundHeaders: string[] = [];
    const missingHeaders: string[] = [];
    
    REQUIRED_HEADERS.forEach(header => {
      if (netlifyToml.includes(header)) {
        foundHeaders.push(header);
        log(`  ✓ ${header}`, 'green');
      } else {
        missingHeaders.push(header);
        log(`  ✗ ${header}`, 'red');
      }
    });

    if (missingHeaders.length > 0) {
      log(`\n⚠️  Missing headers in netlify.toml: ${missingHeaders.join(', ')}`, 'yellow');
      return false;
    }

    log('\n✅ All security headers found in netlify.toml', 'green');
    return true;
  } catch (error) {
    log('\n❌ Error reading netlify.toml', 'red');
    if (error instanceof Error) {
      log(`  ${error.message}`, 'red');
    }
    return false;
  }
}

function checkServerCode() {
  log('\n🔍 Checking Server Code...\n', 'blue');
  
  try {
    const entryServer = readFileSync(
      join(process.cwd(), 'app', 'entry.server.tsx'),
      'utf-8'
    );
    
    if (entryServer.includes('setSecurityHeaders')) {
      log('  ✓ Security headers function found', 'green');
      
      // Check for specific headers
      const headersInCode = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
      ];
      
      let allFound = true;
      headersInCode.forEach(header => {
        if (entryServer.includes(header)) {
          log(`  ✓ ${header}`, 'green');
        } else {
          log(`  ✗ ${header}`, 'yellow');
          allFound = false;
        }
      });
      
      return allFound;
    } else {
      log('  ✗ setSecurityHeaders function not found', 'red');
      return false;
    }
  } catch (error) {
    log('\n❌ Error reading entry.server.tsx', 'red');
    if (error instanceof Error) {
      log(`  ${error.message}`, 'red');
    }
    return false;
  }
}

function main() {
  log('\n🛡️  Security Headers Verification\n', 'blue');
  
  const netlifyOk = checkNetlifyConfig();
  const serverOk = checkServerCode();
  
  if (netlifyOk && serverOk) {
    log('\n✨ All security headers are properly configured!', 'green');
    log('\n📝 Note: After deployment, verify headers in browser dev tools:', 'blue');
    log('   1. Open your site in a browser', 'blue');
    log('   2. Open DevTools > Network tab', 'blue');
    log('   3. Reload the page', 'blue');
    log('   4. Check response headers for security headers', 'blue');
    process.exit(0);
  } else {
    log('\n❌ Some security headers are missing or misconfigured', 'red');
    process.exit(1);
  }
}

main();

