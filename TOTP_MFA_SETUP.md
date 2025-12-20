# TOTP MFA Implementation - Setup Guide

## ✅ What's Been Implemented

### Backend (Complete)
- ✅ TOTP MFA Plugin (`apps/api/src/plugins/totp-mfa/`)
- ✅ Database migrations for `totpSecret` and `totp_setup_temp` table
- ✅ Authentication strategy that wraps native auth
- ✅ GraphQL API for MFA operations
- ✅ Plugin registered in `vendure-config.ts`

### Admin UI Extension (Created, needs compilation)
- ✅ Extension package structure (`apps/admin-ui-extensions/totp-mfa/`)
- ✅ MFA Setup component
- ✅ TOTP Login interceptor
- ⚠️ Needs: Build and integration with login component

## 🚀 Next Steps to Complete Setup

### 1. Install Dependencies

```bash
# Backend dependencies (already done)
cd apps/api
pnpm install

# Admin UI extension dependencies
cd ../admin-ui-extensions/totp-mfa
pnpm install
```

### 2. Run Database Migrations

```bash
cd apps/api
pnpm run migration:run
```

This will:
- Add `totpSecret` column to `administrator` table
- Create `totp_setup_temp` table for temporary secret storage

### 3. Build Admin UI Extension

```bash
cd apps/admin-ui-extensions/totp-mfa
pnpm run build
```

### 4. Restart API Server

After migrations and builds:
```bash
# If using Docker
docker compose restart vendure-api

# If running directly
cd apps/api
pnpm run dev  # or pnpm start for production
```

### 5. Access MFA Setup

Once the server is running:
1. Log in to Admin UI (normal login works)
2. Navigate to: `/admin/settings/security`
3. Follow the setup wizard to enable MFA

## 🔧 How It Works

### For Existing Admins (No MFA)
- Login works normally with just username/password
- Can optionally enable MFA via settings page

### For Admins with MFA Enabled
1. Enter username/password → Login starts
2. System detects MFA is enabled
3. Admin UI shows TOTP input field
4. Enter 6-digit code from authenticator app
5. Login completes

### Setup Flow
1. Admin logs in normally
2. Goes to Settings → Security
3. Enters password to start setup
4. Scans QR code with authenticator app (Google Authenticator, Authy, etc.)
5. Enters 6-digit code to verify
6. MFA is now enabled

## ⚠️ Important Notes

1. **Backward Compatible**: Existing logins work without MFA until enabled
2. **Migrations are Safe**: Uses `IF NOT EXISTS` to prevent errors
3. **Login Component**: The TOTP login input during login may need additional integration with Vendure's core login component
4. **Testing**: Test thoroughly before enabling MFA on production accounts

## 🐛 Troubleshooting

### Migrations Fail
- Check database connection
- Ensure you have proper permissions
- Check migration files are in `apps/api/migrations/`

### Admin UI Extension Not Loading
- Ensure extension is built: `pnpm run build` in extension directory
- Check `vendure-config.ts` has correct path to extension
- Check browser console for errors

### TOTP Not Working
- Verify authenticator app time is synced
- Check server time is accurate
- Ensure secret was saved correctly (check database)

## 📝 GraphQL API

The following mutations/queries are available:

```graphql
# Check if MFA is enabled
query {
  isTotpEnabled
}

# Start MFA setup
mutation {
  initTotpSetup(password: "your-password") {
    secret
    qrCodeUri
  }
}

# Complete MFA setup
mutation {
  enableTotp(token: "123456") {
    success
  }
}

# Disable MFA
mutation {
  disableTotp(password: "your-password") {
    success
  }
}
```

## 🔒 Security

- TOTP secrets stored in database (consider encryption at rest)
- Temporary secrets expire after 10 minutes
- Password required for setup/disable operations
- TOTP validation uses industry-standard `otplib` library


