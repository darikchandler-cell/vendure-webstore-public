import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates required and optional environment variables on startup
 */
const envSchema = z.object({
  // Required in production
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters long')
    .optional()
    .refine(
      (val) => {
        // In production, SESSION_SECRET is required
        if (
          typeof process !== 'undefined' &&
          process.env.NODE_ENV === 'production'
        ) {
          return val !== undefined && val.length >= 32;
        }
        // In development, it's optional (will show warning)
        return true;
      },
      {
        message:
          'SESSION_SECRET is required in production and must be at least 32 characters',
      },
    ),

  // Required
  VENDURE_API_URL: z.string().url('VENDURE_API_URL must be a valid URL'),

  // Optional - Channel tokens for multi-channel support
  US_CHANNEL_TOKEN: z.string().optional(),
  CA_CHANNEL_TOKEN: z.string().optional(),
  
  // Optional - Public API URL (for client-side)
  PUBLIC_VENDURE_API_URL: z.string().url().optional(),

  // Optional
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'Stripe publishable key must start with pk_')
    .optional(),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Optional analytics
  GA_MEASUREMENT_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  APP_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables
 * Call this early in the application startup
 */
export function validateEnv(): Env {
  const env = {
    SESSION_SECRET:
      typeof process !== 'undefined' ? process.env.SESSION_SECRET : undefined,
    VENDURE_API_URL:
      typeof process !== 'undefined'
        ? process.env.VENDURE_API_URL
        : 'https://readonlydemo.vendure.io/shop-api',
    US_CHANNEL_TOKEN:
      typeof process !== 'undefined' ? process.env.US_CHANNEL_TOKEN : undefined,
    CA_CHANNEL_TOKEN:
      typeof process !== 'undefined' ? process.env.CA_CHANNEL_TOKEN : undefined,
    PUBLIC_VENDURE_API_URL:
      typeof process !== 'undefined'
        ? process.env.PUBLIC_VENDURE_API_URL
        : undefined,
    STRIPE_PUBLISHABLE_KEY:
      typeof process !== 'undefined'
        ? process.env.STRIPE_PUBLISHABLE_KEY
        : undefined,
    NODE_ENV:
      typeof process !== 'undefined'
        ? (process.env.NODE_ENV as 'development' | 'production' | 'test')
        : 'development',
    GA_MEASUREMENT_ID:
      typeof process !== 'undefined'
        ? process.env.GA_MEASUREMENT_ID
        : undefined,
    SENTRY_DSN:
      typeof process !== 'undefined' ? process.env.SENTRY_DSN : undefined,
    APP_URL: typeof process !== 'undefined' ? process.env.APP_URL : undefined,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      return `${err.path.join('.')}: ${err.message}`;
    });

    console.error('❌ Environment variable validation failed:');
    console.error(errors.join('\n'));
    console.error('\nPlease check your .env file or environment variables.');

    // In production, throw error to prevent startup with invalid config
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'production'
    ) {
      throw new Error(
        `Invalid environment configuration: ${errors.join(', ')}`,
      );
    }

    // In development, warn but continue
    console.warn(
      '⚠️  Continuing with invalid configuration (development mode)',
    );
  }

  return result.success ? result.data : (env as Env);
}

/**
 * Get validated environment variables
 * Use this instead of directly accessing process.env
 */
export function getEnv(): Env {
  return validateEnv();
}
