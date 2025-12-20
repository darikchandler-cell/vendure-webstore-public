import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateEnv } from '../app/utils/env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should validate required VENDURE_API_URL', () => {
    process.env.VENDURE_API_URL = 'https://example.com/api';
    process.env.NODE_ENV = 'development';

    expect(() => validateEnv()).not.toThrow();
  });

  it('should require SESSION_SECRET in production', () => {
    process.env.VENDURE_API_URL = 'https://example.com/api';
    process.env.NODE_ENV = 'production';
    delete process.env.SESSION_SECRET;

    // In production, validation should throw an error
    expect(() => validateEnv()).toThrow('Invalid environment configuration');
  });

  it('should validate SESSION_SECRET length in production', () => {
    process.env.VENDURE_API_URL = 'https://example.com/api';
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'short'; // Too short

    // Should throw error in production for invalid SESSION_SECRET
    expect(() => validateEnv()).toThrow('Invalid environment configuration');
  });

  it('should accept valid SESSION_SECRET in production', () => {
    process.env.VENDURE_API_URL = 'https://example.com/api';
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'a'.repeat(32); // Valid length

    expect(() => validateEnv()).not.toThrow();
  });

  it('should validate Stripe key format', () => {
    process.env.VENDURE_API_URL = 'https://example.com/api';
    process.env.NODE_ENV = 'development';
    process.env.STRIPE_PUBLISHABLE_KEY = 'invalid-key';

    // In development, should not throw but should warn about format
    const result = validateEnv();
    expect(result).toBeDefined();
  });

  it('should accept valid Stripe key', () => {
    process.env.VENDURE_API_URL = 'https://example.com/api';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_valid_key';

    expect(() => validateEnv()).not.toThrow();
  });
});

