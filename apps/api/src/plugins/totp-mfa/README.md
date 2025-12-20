# TOTP MFA Plugin for Vendure

This plugin adds Time-based One-Time Password (TOTP) Multi-Factor Authentication (MFA) for Vendure Admin UI.

## Backend Implementation (Complete)

### Features
- TOTP secret storage in `administrator.totpSecret` custom field
- Temporary secret storage during setup (in `totp_setup_temp` table)
- Authentication strategy that wraps NativeAuthenticationStrategy
- GraphQL mutations for MFA setup and management
- Backward compatible - existing admins can log in normally until they enable MFA

### Database Migrations
1. `1733000000000-add-totp-secret-to-administrator.ts` - Adds `totpSecret` column
2. `1733000000001-create-totp-setup-temp-table.ts` - Creates temporary storage table

### GraphQL API

**Query:**
- `isTotpEnabled: Boolean!` - Check if current admin has MFA enabled

**Mutations:**
- `initTotpSetup(password: String!): InitTotpSetupResult!` - Start MFA setup, returns QR code URI
- `enableTotp(token: String!): EnableTotpResult!` - Complete MFA setup by verifying token
- `verifyTotpLogin(username: String!, token: String!): VerifyTotpLoginResult!` - Verify TOTP during login
- `disableTotp(password: String!): DisableTotpResult!` - Disable MFA (requires password)

### Authentication Flow

1. User enters username/password
2. `TotpMfaAuthenticationStrategy` authenticates with NativeAuthenticationStrategy
3. If TOTP is enabled and no token provided → throws `TOTP_REQUIRED` error
4. Admin UI intercepts error and prompts for TOTP token
5. User enters TOTP token
6. Admin UI retries login with `{ username, password, totpToken }`
7. Strategy verifies TOTP token and completes login

### Setup Flow (for existing admins)

1. Admin logs in normally (password only)
2. Navigates to settings/security page
3. Calls `initTotpSetup` with password
4. Scans QR code with authenticator app
5. Enters 6-digit code from app
6. Calls `enableTotp` with token
7. MFA is now enabled for future logins

## Admin UI Extension (TODO)

The Admin UI extension needs to be created separately. It should:

1. **MFA Setup Component** (`/admin/settings/security` or similar)
   - Display QR code from `initTotpSetup`
   - Input field for 6-digit token
   - Call `enableTotp` to complete setup

2. **TOTP Login Component**
   - Intercept `TOTP_REQUIRED` error during login
   - Show TOTP input field
   - Retry login with username, password, and totpToken

3. **MFA Status Indicator**
   - Show if MFA is enabled
   - Option to disable MFA

## Installation

1. Dependencies are already added to `package.json`
2. Plugin is registered in `vendure-config.ts`
3. Run migrations: `pnpm run migration:run`
4. Restart the API server

## Security Notes

- TOTP secrets are stored in the database (encrypted at rest if database encryption is enabled)
- Temporary secrets expire after 10 minutes
- Password verification required for setup and disable operations
- TOTP tokens are validated using `otplib` with default window tolerance

## Testing

1. Login without MFA (should work normally)
2. Enable MFA via Admin UI
3. Logout and login again (should require TOTP)
4. Test invalid TOTP token (should fail)
5. Test disable MFA


