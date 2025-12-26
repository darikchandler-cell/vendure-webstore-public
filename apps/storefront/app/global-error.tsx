'use client';

import { useEffect } from 'react';
import { reportErrorAsync } from '../lib/error-reporter';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report critical global error
    reportErrorAsync(error, {
      source: 'storefront',
      component: 'GlobalError',
      digest: error.digest,
      severity: 'critical',
    });
  }, [error]);
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Application Error
            </h1>
            <p className="text-gray-600 mb-6">
              A critical error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={reset}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}




