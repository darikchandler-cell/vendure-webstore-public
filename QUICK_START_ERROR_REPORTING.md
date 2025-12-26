# Quick Start: Error Reporting Setup

## 🚀 Quick Setup (5 minutes)

### 1. Get GitHub Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Error Reporting`
4. Select scope: `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### 2. Add Environment Variables

#### API (`apps/api/.env`)
```bash
# Add these lines:
ERROR_REPORT_EMAIL=darikchandler@gmail.com
GITHUB_TOKEN=paste_your_token_here
GITHUB_OWNER=darikchandler-cell
GITHUB_REPO=vendure-hunterirrigation
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

