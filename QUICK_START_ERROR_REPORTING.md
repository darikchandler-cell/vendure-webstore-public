# Quick Start: Error Reporting Setup

## ✅ Configuration Complete!

The error reporting system has been automatically configured with your GitHub token.

### What's Configured

✅ **API Error Reporting** (`apps/api/.env`)
- ERROR_REPORT_EMAIL=darikchandler@gmail.com
- GITHUB_TOKEN=configured
- GITHUB_OWNER=darikchandler-cell
- GITHUB_REPO=vendure-hunterirrigation

### Next Steps

1. **Restart your API server** for changes to take effect:
   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Test the system** (optional):
   - Set `ENABLE_ERROR_REPORTING=true` in `apps/api/.env` to test in development
   - Trigger an error or visit a broken page
   - Check your email and GitHub issues

### Manual Setup (if needed)

If you need to reconfigure, run:
```bash
bash apps/api/setup-error-reporting.sh
```

#### Storefront (`apps/storefront/.env.local`)
```bash
# Add this line:
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Remix Storefront (`apps/remix-storefront/.env`)
```bash
# Add this line:
API_URL=http://localhost:3000
```

### 3. Test It

#### Option A: Test in Development
1. Add to `apps/api/.env`:
   ```bash
   ENABLE_ERROR_REPORTING=true
   ```
2. Restart API server
3. Trigger an error (e.g., visit a broken page)
4. Check:
   - ✅ Email at `darikchandler@gmail.com`
   - ✅ GitHub issue created

#### Option B: Test Manually
```typescript
// In any API file
import { reportError } from './utils/error-reporter';
reportError(new Error('Test error'), { source: 'api', test: true });
```

## ✅ What's Already Configured

- ✅ Error detection in API (uncaught exceptions, unhandled rejections)
- ✅ Error detection in Storefront (error boundaries)
- ✅ Error detection in Remix Storefront (error boundaries)
- ✅ Email sending via AWS SES (already configured)
- ✅ GitHub issue creation (just needs token)

## 📧 Email Format

You'll receive emails with:
- Error message and stack trace
- Source application
- Timestamp and environment
- URL and user context
- Full error details

## 🎫 GitHub Issues

Issues are automatically created with:
- Title: Error message
- Labels: `bug`, `auto-reported`, `api`/`storefront`/`remix-storefront`
- Body: Full error details in markdown

## 🔧 Troubleshooting

**No emails?**
- Check SMTP credentials in `apps/api/.env`
- Verify AWS SES is configured

**No GitHub issues?**
- Verify `GITHUB_TOKEN` is set correctly
- Check token has `repo` permissions
- Check API logs for errors

**Errors not reported?**
- In development, set `ENABLE_ERROR_REPORTING=true`
- Check browser console for errors
- Verify API endpoint is accessible

## 📚 Full Documentation

See `ERROR_REPORTING_SETUP.md` for complete details.

