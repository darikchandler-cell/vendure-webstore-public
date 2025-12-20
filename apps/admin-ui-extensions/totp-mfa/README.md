# TOTP MFA Admin UI Extension

This is the Admin UI extension package for the TOTP MFA plugin. It provides:

1. **MFA Setup Page** - Accessible at `/admin/settings/security`
   - Enable/disable MFA
   - Display QR code for setup
   - Verify and enable TOTP

2. **TOTP Login Interceptor** - Handles `TOTP_REQUIRED` errors during login
   - Intercepts login failures
   - Triggers TOTP input flow

## Installation

1. Install dependencies:
   ```bash
   cd apps/admin-ui-extensions/totp-mfa
   pnpm install
   ```

2. Build the extension:
   ```bash
   pnpm run build
   ```

3. The extension is automatically registered in `vendure-config.ts` via `AdminUiPlugin.init()`

## Development

The extension uses:
- Angular (Vendure Admin UI framework)
- `angularx-qrcode` for QR code generation
- Vendure UI DevKit for extension structure

## Components

- `MfaSetupComponent` - Main setup/management component
- `TotpLoginInterceptor` - HTTP interceptor for login flow

## Note

The login component that handles TOTP input during login needs to be integrated with Vendure's login component. This may require modifying the core login component or creating a custom login override.


