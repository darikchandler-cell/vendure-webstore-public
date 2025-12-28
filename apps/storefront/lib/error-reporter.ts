/**
 * Client-side Error Reporting Service for Next.js Storefront
 * 
 * Automatically detects user issues/bugs and reports them via API endpoint
 */

interface ErrorContext {
  /** Application source */
  source?: string;
  /** User ID if available */
  userId?: string;
  /** Request URL */
  url?: string;
  /** Additional context data */
  [key: string]: any;
}

/**
 * Report error to backend API which handles email and GitHub issue creation
 */
export async function reportError(error: Error, context: ErrorContext = {}): Promise<void> {
  // Don't report in development unless explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment && process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING !== 'true') {
    console.log('⚠️  Error reporting disabled in development mode');
    console.error('Error:', error, context);
    return;
  }

  try {
    const reportData = {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      context: {
        source: 'storefront',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...context,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Send to API endpoint
    const response = await fetch('/api/report-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      console.error('❌ Failed to report error:', response.status, response.statusText);
    } else {
      const result = await response.json();
      console.log('✅ Error reported successfully', result);
    }
  } catch (err: any) {
    console.error('❌ Error reporting failed:', err.message);
  }
}

/**
 * Report an error synchronously (fire and forget)
 */
export function reportErrorAsync(error: Error, context: ErrorContext = {}): void {
  reportError(error, context).catch((err) => {
    console.error('❌ Failed to report error:', err);
  });
}



