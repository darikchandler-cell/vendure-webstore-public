#!/usr/bin/env ts-node
/**
 * Environment Variable Verification Script
 * 
 * Verifies that all required environment variables are set correctly
 * Run this before deployment: yarn verify:env
 */

import { validateEnv } from '../app/utils/env-validation.js';

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

function main() {
  log('\n🔍 Verifying Environment Variables...\n', 'blue');

  try {
    const env = validateEnv();
    
    log('✅ Environment variables validated successfully!\n', 'green');
    
    log('Required Variables:', 'blue');
    log(`  ✓ VENDURE_API_URL: ${env.VENDURE_API_URL ? 'Set' : 'Missing'}`, 
        env.VENDURE_API_URL ? 'green' : 'red');
    
    if (process.env.NODE_ENV === 'production') {
      log(`  ✓ SESSION_SECRET: ${env.SESSION_SECRET ? `Set (${env.SESSION_SECRET.length} chars)` : 'Missing'}`, 
          env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 ? 'green' : 'red');
    } else {
      log(`  ⚠ SESSION_SECRET: ${env.SESSION_SECRET ? `Set (${env.SESSION_SECRET.length} chars)` : 'Not set (optional in dev)'}`, 
          env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 ? 'green' : 'yellow');
    }

    log('\nOptional Variables:', 'blue');
    log(`  ${env.STRIPE_PUBLISHABLE_KEY ? '✓' : '○'} STRIPE_PUBLISHABLE_KEY: ${env.STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not set'}`, 
        env.STRIPE_PUBLISHABLE_KEY ? 'green' : 'yellow');
    log(`  ${env.GA_MEASUREMENT_ID ? '✓' : '○'} GA_MEASUREMENT_ID: ${env.GA_MEASUREMENT_ID ? 'Set' : 'Not set'}`, 
        env.GA_MEASUREMENT_ID ? 'green' : 'yellow');
    log(`  ${env.SENTRY_DSN ? '✓' : '○'} SENTRY_DSN: ${env.SENTRY_DSN ? 'Set' : 'Not set'}`, 
        env.SENTRY_DSN ? 'green' : 'yellow');
    log(`  ${env.APP_URL ? '✓' : '○'} APP_URL: ${env.APP_URL ? 'Set' : 'Not set'}`, 
        env.APP_URL ? 'green' : 'yellow');

    // Check for production readiness
    if (process.env.NODE_ENV === 'production') {
      const issues: string[] = [];
      
      if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
        issues.push('SESSION_SECRET must be at least 32 characters in production');
      }
      
      if (!env.VENDURE_API_URL) {
        issues.push('VENDURE_API_URL is required');
      }

      if (issues.length > 0) {
        log('\n❌ Production environment issues found:', 'red');
        issues.forEach(issue => log(`  - ${issue}`, 'red'));
        process.exit(1);
      }
    }

    log('\n✨ All checks passed!', 'green');
    process.exit(0);
  } catch (error) {
    log('\n❌ Environment validation failed:', 'red');
    if (error instanceof Error) {
      log(`  ${error.message}`, 'red');
    }
    process.exit(1);
  }
}

main();

