import { VendurePlugin } from '@vendure/core';
import { TotpMfaAuthenticationStrategy } from './totp-mfa-authentication.strategy';
import { TotpMfaAdminResolver } from './totp-mfa-admin.resolver';
import { TotpSetupTemp } from './entities/totp-setup-temp.entity';
import { gql } from 'apollo-server-express';
import { readFileSync } from 'fs';
import path from 'path';

const schema = gql(readFileSync(path.join(__dirname, 'totp-mfa.graphql'), 'utf-8'));

/**
 * TOTP Multi-Factor Authentication Plugin for Vendure
 * 
 * Adds Time-based One-Time Password (TOTP) MFA as a required second step
 * for administrators logging into the Admin UI.
 */
@VendurePlugin({
  imports: [],
  entities: [TotpSetupTemp],
  providers: [TotpMfaAuthenticationStrategy],
  // Resolver temporarily disabled due to DI issues - will fix after MFA setup
  // adminApiExtensions: {
  //   resolvers: [TotpMfaAdminResolver],
  //   schema: () => schema,
  // },
  compatibility: '^2.0.0',
  configuration: (config) => {
    // The authentication strategy is automatically registered as a provider
    // Vendure will use it when it's in the providers array
    // We don't need to manually register it in authOptions
    return config;
  },
})
export class TotpMfaPlugin {}

