/**
 * Error monitoring and analytics utilities
 * Supports Sentry for error tracking and Google Analytics for analytics
 */

// Error Monitoring (Sentry)
let sentryInitialized = false;

export async function initErrorMonitoring() {
  // Only initialize in production or if explicitly enabled
  const isProduction =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  const sentryDsn =
    typeof process !== 'undefined' ? process.env.SENTRY_DSN : undefined;

  if (sentryDsn && (isProduction || process.env.ENABLE_SENTRY === 'true')) {
    try {
      // Dynamic import to avoid bundling Sentry in development
      const Sentry = await import('@sentry/remix');
      Sentry.init({
        dsn: sentryDsn,
        environment: isProduction ? 'production' : 'development',
        tracesSampleRate: isProduction ? 0.1 : 1.0,
        integrations: [],
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request) {
            // Remove sensitive headers
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
          }
          return event;
        },
      });
      sentryInitialized = true;
      console.log('✅ Error monitoring initialized (Sentry)');
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }
}

/**
 * Report error to backend API for email and GitHub issue creation
 */
async function reportErrorToBackend(error: Error, context?: Record<string, any>) {
  const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  if (isDevelopment && process.env.ENABLE_ERROR_REPORTING !== 'true') {
    return; // Skip in development unless enabled
  }

  try {
    // Get API URL - use environment variable or default
    const apiUrl = typeof process !== 'undefined' 
      ? process.env.API_URL || process.env.VENDURE_API_URL || 'http://localhost:3000'
      : typeof window !== 'undefined' && (window as any).__API_URL__
        ? (window as any).__API_URL__
        : 'http://localhost:3000';
    
    const reportData = {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      context: {
        source: 'remix-storefront',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...context,
      },
      timestamp: new Date().toISOString(),
      environment: typeof process !== 'undefined' ? process.env.NODE_ENV || 'development' : 'browser',
    };

    await fetch(`${apiUrl}/api/report-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });
  } catch (err) {
    // Silently fail - don't break error handling
    console.error('Failed to report error to backend:', err);
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  // Report to backend for email and GitHub issue creation
  reportErrorToBackend(error, context).catch(() => {
    // Silently fail
  });

  if (sentryInitialized) {
    import('@sentry/remix').then((Sentry) => {
      Sentry.captureException(error, {
        extra: context,
      });
    });
  }
  // Always log to console as fallback
  console.error('Error:', error, context);
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>,
) {
  if (sentryInitialized) {
    import('@sentry/remix').then((Sentry) => {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      });
    });
  }
  console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
    message,
    context,
  );
}

// Analytics (Google Analytics)
export function initAnalytics() {
  const gaId =
    typeof process !== 'undefined' ? process.env.GA_MEASUREMENT_ID : undefined;

  if (gaId && typeof window !== 'undefined') {
    // Initialize Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);
  }
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

export function trackPageView(path: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const gaId =
      typeof process !== 'undefined'
        ? process.env.GA_MEASUREMENT_ID
        : undefined;
    if (gaId) {
      (window as any).gtag('config', gaId, {
        page_path: path,
      });
    }
  }
}

// E-commerce tracking helpers
export function trackPurchase(
  orderCode: string,
  value: number,
  currency: string,
) {
  trackEvent('purchase', 'ecommerce', orderCode, value);
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'purchase', {
      transaction_id: orderCode,
      value: value,
      currency: currency,
    });
  }
}

export function trackAddToCart(productSlug: string, value: number) {
  trackEvent('add_to_cart', 'ecommerce', productSlug, value);
}

export function trackBeginCheckout(value: number) {
  trackEvent('begin_checkout', 'ecommerce', undefined, value);
}
