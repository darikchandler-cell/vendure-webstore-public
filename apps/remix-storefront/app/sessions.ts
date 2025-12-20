import {
  IS_CF_PAGES,
  safeRequireNodeDependency,
} from '~/utils/platform-adapter';
import { SessionStorage } from '@remix-run/server-runtime/dist/sessions';
import { ErrorResult } from '~/generated/graphql';
import { createCookieSessionStorage } from '@remix-run/cloudflare';
import { CreateCookieSessionStorageFunction } from '@remix-run/server-runtime';
import type { AppLoadContext } from '@remix-run/server-runtime';

async function getCookieSessionStorageFactory(): Promise<CreateCookieSessionStorageFunction> {
  if (IS_CF_PAGES) {
    return createCookieSessionStorage;
  } else {
    return safeRequireNodeDependency('@remix-run/node').then(
      (module) => module.createCookieSessionStorage,
    );
  }
}
let sessionStorage: SessionStorage<
  { activeOrderError: ErrorResult } & Record<string, any>
>;

function getSessionSecret(context?: AppLoadContext): string[] {
  // In Cloudflare Pages, env vars come from context, not process.env
  // For Node.js, use process.env
  let secret: string | undefined;

  if (IS_CF_PAGES && context && 'SESSION_SECRET' in context) {
    secret = context.SESSION_SECRET as string | undefined;
  } else if (typeof process !== 'undefined') {
    secret = process.env.SESSION_SECRET;
  }

  if (!secret) {
    const isProduction =
      typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new Error(
        'SESSION_SECRET environment variable is required in production. Please set a strong random secret.',
      );
    }
    // Development fallback - warn but allow
    console.warn(
      '⚠️  WARNING: SESSION_SECRET not set. Using insecure default for development only.',
    );
    return ['insecure-dev-secret-change-in-production'];
  }

  if (secret.length < 32) {
    console.warn(
      '⚠️  WARNING: SESSION_SECRET should be at least 32 characters long for security.',
    );
  }

  return [secret];
}

export async function getSessionStorage(context?: AppLoadContext) {
  if (sessionStorage) {
    return sessionStorage;
  }
  const factory = await getCookieSessionStorageFactory();
  const isProduction =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  sessionStorage = factory({
    cookie: {
      name: 'vendure_remix_session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
      secrets: getSessionSecret(context),
    },
  });
  return sessionStorage;
}
