import {
  AuthenticationStrategy,
  Injector,
  RequestContext,
  User,
  NativeAuthenticationStrategy,
  TransactionalConnection,
} from '@vendure/core';
import { authenticator } from 'otplib';
import { gql } from 'apollo-server-express';
import { DocumentNode } from 'graphql';

/**
 * TOTP MFA Authentication Strategy that wraps the NativeAuthenticationStrategy.
 * 
 * Flow:
 * 1. First authenticates with username/password using NativeAuthenticationStrategy
 * 2. If successful and administrator has totpSecret, returns TOTP_REQUIRED error
 * 3. If totpSecret is null, allows normal login (for initial setup)
 */
export class TotpMfaAuthenticationStrategy implements AuthenticationStrategy {
  readonly name = 'totp-mfa';

  private nativeStrategy!: NativeAuthenticationStrategy;
  private connection!: TransactionalConnection;

  defineInputType(): DocumentNode {
    return gql`
      input TotpLoginInput {
        username: String!
        password: String!
        totpToken: String
      }
    `;
  }

  async init(injector: Injector): Promise<void> {
    this.nativeStrategy = injector.get(NativeAuthenticationStrategy);
    this.connection = injector.get(TransactionalConnection);
    await this.nativeStrategy.init(injector);
  }

  async authenticate(
    ctx: RequestContext,
    data: { username: string; password: string; totpToken?: string },
  ): Promise<User | false> {
    // First, authenticate with native strategy (username/password)
    const user = await this.nativeStrategy.authenticate(ctx, {
      username: data.username,
      password: data.password,
    });
    
    if (!user) {
      return false;
    }

    // Check if this is an administrator with TOTP enabled
    const administrator = await this.connection
      .getRepository(ctx, 'Administrator')
      .findOne({
        where: { user: { id: user.id } },
        relations: ['user'],
      });

    if (administrator && administrator.customFields?.totpSecret) {
      // TOTP is enabled - verify the token if provided
      if (data.totpToken) {
        const isValid = authenticator.check(
          data.totpToken,
          administrator.customFields.totpSecret,
        );
        if (!isValid) {
          return false; // Invalid TOTP token
        }
        // TOTP verified, proceed with login
        return user;
      } else {
        // TOTP is required but not provided
        // Return a special error that the Admin UI can intercept
        throw new Error('TOTP_REQUIRED');
      }
    }

    // No TOTP enabled, proceed with normal login
    return user;
  }
}

