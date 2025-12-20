import type { EntryContext } from '@remix-run/server-runtime';
import { RemixServer } from '@remix-run/react';
import isbot from 'isbot';

import ReactDOM from 'react-dom/server';

import { createInstance } from 'i18next';
import { getI18NextServer, getPlatformBackend } from './i18next.server';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from './i18n';
import {
  IS_CF_PAGES,
  safeRequireNodeDependency,
} from '~/utils/platform-adapter';
import { captureException } from '~/utils/monitoring';

const ABORT_DELAY = 5000;

// Initialize error monitoring on server startup
if (typeof process !== 'undefined') {
  import('~/utils/monitoring').then(({ initErrorMonitoring }) => {
    initErrorMonitoring().catch((err) => {
      console.warn('Failed to initialize error monitoring:', err);
    });
  });
}

type PlatformRequestHandler = (
  arg0: Request,
  arg1: number,
  arg2: Headers,
  arg3: EntryContext,
  arg4: JSX.Element,
) => Response | Promise<Response>;

function setSecurityHeaders(headers: Headers) {
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const isProduction =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  if (isProduction) {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
  }
  // CSP is set per-route or via Netlify config to allow flexibility
}

async function handleCfRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  jsx: JSX.Element,
) {
  const body = await ReactDOM.renderToReadableStream(jsx, {
    signal: request.signal,
    onError(error: unknown) {
      // Log streaming rendering errors from inside the shell
      if (error instanceof Error) {
        captureException(error, {
          component: 'handleCfRequest',
          url: request.url,
        });
      }
      console.error(error);
      responseStatusCode = 500;
    },
  });

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  setSecurityHeaders(responseHeaders);
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

async function handleNodeRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  jsx: JSX.Element,
): Promise<Response> {
  let callbackName = isbot(request.headers.get('user-agent'))
    ? 'onAllReady'
    : 'onShellReady';

  return new Promise((resolve, reject) => {
    let didError = false;

    let { pipe, abort } = ReactDOM.renderToPipeableStream(jsx, {
      [callbackName]: async () => {
        const { PassThrough } = await safeRequireNodeDependency('node:stream');

        const { createReadableStreamFromReadable } =
          await safeRequireNodeDependency('@remix-run/node');

        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        responseHeaders.set('Content-Type', 'text/html');
        setSecurityHeaders(responseHeaders);

        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: didError ? 500 : responseStatusCode,
          }),
        );
        pipe(body);
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        didError = true;
        if (error instanceof Error) {
          captureException(error, {
            component: 'handleNodeRequest',
            url: request.url,
          });
        }
        console.error(error);
      },
    });

    setTimeout(abort, ABORT_DELAY);
  });
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  let instance = createInstance();
  let lng = await getI18NextServer().then((i18next) =>
    i18next.getLocale(request),
  );

  await instance
    .use(initReactI18next)
    .use(await getPlatformBackend())
    .init({
      ...i18n,
      lng,
    });

  const jsx = (
    <I18nextProvider i18n={instance}>
      <RemixServer context={remixContext} url={request.url} />
    </I18nextProvider>
  );

  const requestHandler: PlatformRequestHandler = IS_CF_PAGES
    ? handleCfRequest
    : handleNodeRequest;

  return requestHandler(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext,
    jsx,
  );
}
