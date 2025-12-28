# Automatic Error Reporting & Bug Detection Setup

## Overview

This system automatically detects user issues and bugs across all applications and:
1. **Sends detailed email** to `darikchandler@gmail.com`
2. **Creates GitHub issue ticket** automatically

## What Gets Reported

- Uncaught exceptions in API
- Unhandled promise rejections in API
- Bootstrap/startup errors
- Storefront error boundary catches
- Remix storefront error boundary catches
- Any manually reported errors

## Configuration

### Required Environment Variables

Add these to your `.env` files:

#### API (`apps/api/.env`)
```bash
# Error Reporting Email (defaults to darikchandler@gmail.com)
ERROR_REPORT_EMAIL=darikchandler@gmail.com

# GitHub Integration (for automatic issue creation)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=darikchandler-cell
GITHUB_REPO=vendure-hunterirrigation

# SMTP Configuration (already configured for email sending)
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Enable error reporting in development (optional)
ENABLE_ERROR_REPORTING=false  # Set to 'true' to test in dev
```

#### Storefront (`apps/storefront/.env.local`)
```bash
# API URL for error reporting
NEXT_PUBLIC_API_URL=http://localhost:3000

# Enable error reporting in development (optional)
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=false  # Set to 'true' to test in dev
```

#### Remix Storefront (`apps/remix-storefront/.env`)
```bash
# API URL for error reporting
API_URL=http://localhost:3000

# Enable error reporting in development (optional)
ENABLE_ERROR_REPORTING=false  # Set to 'true' to test in dev
```

### GitHub Token Setup

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
3. Copy the token and add to `GITHUB_TOKEN` environment variable

## How It Works

### API Error Reporting

Located in: `apps/api/src/utils/error-reporter.ts`

- Catches uncaught exceptions
- Catches unhandled promise rejections
- Sends formatted email with full error details
- Creates GitHub issue with error information
- Includes stack traces, context, and environment info

### Storefront Error Reporting

Located in: `apps/storefront/lib/error-reporter.ts`

- Integrates with Next.js error boundaries
- Reports errors to API endpoint
- Includes user agent, URL, and browser context

### Remix Storefront Error Reporting

Located in: `apps/remix-storefront/app/utils/monitoring.ts`

- Integrates with Remix error boundaries
- Reports errors to API endpoint
- Includes route context and user information

## Email Format

Error reports include:
- **Error message and type**
- **Full stack trace**
- **Source application** (api/storefront/remix-storefront)
- **Environment** (development/production)
- **Timestamp**
- **URL** (if available)
- **User ID** (if available)
- **Additional context** (browser info, request details, etc.)

## GitHub Issue Format

Issues are created with:
- **Title**: Error message (truncated to 100 chars)
- **Labels**: `bug`, `auto-reported`, and source application
- **Body**: Full error details, stack trace, and context
- **Format**: Markdown with code blocks for readability

## Testing

### Test in Development

1. Enable error reporting:
   ```bash
   # In API .env
   ENABLE_ERROR_REPORTING=true
   
   # In Storefront .env.local
   NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
   
   # In Remix Storefront .env
   ENABLE_ERROR_REPORTING=true
   ```

2. Trigger a test error:
   ```typescript
   // In any application
   throw new Error('Test error for reporting system');
   ```

3. Check:
   - Email received at `darikchandler@gmail.com`
   - GitHub issue created in repository

### Manual Error Reporting

You can manually report errors from code:

```typescript
import { reportError } from './utils/error-reporter';

try {
  // Your code
} catch (error) {
  reportError(error, {
    source: 'api',
    userId: '123',
    additionalContext: 'checkout process',
  });
}
```

## API Endpoint

The error reporting endpoint is available at:
- **POST** `/api/report-error`

**Request Body:**
```json
{
  "error": {
    "message": "Error message",
    "name": "Error",
    "stack": "Stack trace..."
  },
  "context": {
    "source": "storefront",
    "url": "https://example.com/page",
    "userId": "123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Files Changed

### API
- `apps/api/src/utils/error-reporter.ts` - Core error reporting service
- `apps/api/src/api/error-report-endpoint.ts` - API endpoint handler
- `apps/api/src/index.ts` - Integrated error handlers

### Storefront (Next.js)
- `apps/storefront/lib/error-reporter.ts` - Client-side reporter
- `apps/storefront/app/api/report-error/route.ts` - API route
- `apps/storefront/app/error.tsx` - Error boundary integration
- `apps/storefront/app/global-error.tsx` - Global error boundary

### Remix Storefront
- `apps/remix-storefront/app/utils/monitoring.ts` - Enhanced with error reporting

## Security Notes

- Error reports are sent via secure SMTP (AWS SES)
- GitHub token should be stored securely (never commit to git)
- Sensitive data is filtered from error reports
- Error reporting is disabled in development by default

## Troubleshooting

### Emails not sending
- Check SMTP credentials in `.env`
- Verify AWS SES is configured correctly
- Check server logs for SMTP errors

### GitHub issues not creating
- Verify `GITHUB_TOKEN` is set correctly
- Check token has `repo` permissions
- Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
- Check API logs for GitHub API errors

### Errors not being reported
- Verify `ENABLE_ERROR_REPORTING=true` in development
- Check that error boundaries are properly integrated
- Verify API endpoint is accessible from storefronts
- Check browser console for reporting errors

## Production Deployment

1. Set environment variables on production server
2. Ensure SMTP credentials are configured
3. Add GitHub token to production environment
4. Verify error reporting is working (it's enabled by default in production)
5. Monitor email inbox and GitHub issues

## Maintenance

- Review GitHub issues regularly
- Clean up resolved auto-reported issues
- Monitor email volume (rate limiting may apply)
- Update error context as needed for better debugging


