import {
  Allow,
  Ctx,
  RequestContext,
  TransactionalConnection,
  AdministratorService,
  PasswordCipher,
  Permission,
} from '@vendure/core';
import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { authenticator } from 'otplib';
import { TotpSetupTemp } from './entities/totp-setup-temp.entity';
import {
  InitTotpSetupResult,
  EnableTotpResult,
  VerifyTotpLoginResult,
  DisableTotpResult,
} from './totp-mfa.types';

/**
 * GraphQL resolver for TOTP MFA operations
 */
@Resolver()
export class TotpMfaAdminResolver {
  constructor(
    private connection: TransactionalConnection,
    private administratorService: AdministratorService,
    private passwordCipher: PasswordCipher,
  ) {}

  @Query(() => Boolean, { name: 'isTotpEnabled' })
  @Allow(Permission.Authenticated)
  async isTotpEnabled(@Ctx() ctx: RequestContext): Promise<boolean> {
    if (!ctx.activeUserId) {
      return false;
    }
    const administrator = await this.administratorService.findOneByUserId(ctx, ctx.activeUserId);
    const customFields = administrator?.customFields as any;
    return !!(customFields?.totpSecret);
  }

  @Mutation(() => InitTotpSetupResult)
  @Allow(Permission.Authenticated)
  async initTotpSetup(
    @Ctx() ctx: RequestContext,
    @Arg('password', () => String) password: string,
  ): Promise<InitTotpSetupResult> {
    if (!ctx.activeUserId) {
      throw new Error('Not authenticated');
    }
    
    const administrator = await this.administratorService.findOneByUserId(ctx, ctx.activeUserId);
    if (!administrator) {
      throw new Error('Administrator not found');
    }

    // Verify password
    const user = administrator.user;
    const passwordValid = await this.passwordCipher.check(
      password,
      (user as any).passwordHash,
    );
    if (!passwordValid) {
      throw new Error('Invalid password');
    }

    const customFields = administrator.customFields as any;
    if (customFields?.totpSecret) {
      throw new Error('TOTP is already enabled');
    }

    // Generate new secret
    const secret = authenticator.generateSecret();
    const serviceName = 'Vendure Admin';
    const accountName = administrator.emailAddress;
    const qrCodeUri = authenticator.keyuri(accountName, serviceName, secret);

    // Store temporarily in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing temp records for this admin
    await this.connection
      .getRepository(ctx, TotpSetupTemp)
      .delete({ administratorId: Number(administrator.id) });

    const tempRecord = this.connection.getRepository(ctx, TotpSetupTemp).create({
      administratorId: Number(administrator.id),
      secret,
      expiresAt,
    });

    await this.connection.getRepository(ctx, TotpSetupTemp).save(tempRecord);

    const result = new InitTotpSetupResult();
    result.secret = secret;
    result.qrCodeUri = qrCodeUri;
    return result;
  }

  @Mutation(() => EnableTotpResult)
  @Allow(Permission.Authenticated)
  async enableTotp(
    @Ctx() ctx: RequestContext,
    @Arg('token', () => String) token: string,
  ): Promise<EnableTotpResult> {
    if (!ctx.activeUserId) {
      throw new Error('Not authenticated');
    }
    
    const administrator = await this.administratorService.findOneByUserId(ctx, ctx.activeUserId);
    if (!administrator) {
      throw new Error('Administrator not found');
    }

    // Get temporary secret
    const tempRecord = await this.connection
      .getRepository(ctx, TotpSetupTemp)
      .findOne({
        where: { administratorId: Number(administrator.id) },
        order: { createdAt: 'DESC' },
      });

    if (!tempRecord) {
      throw new Error('TOTP setup not initialized. Please start the setup process again.');
    }

    // Check if expired
    if (new Date() > tempRecord.expiresAt) {
      await this.connection
        .getRepository(ctx, TotpSetupTemp)
        .delete({ id: tempRecord.id });
      throw new Error('TOTP setup expired. Please start the setup process again.');
    }

    // Verify token
    const isValid = authenticator.check(token, tempRecord.secret);
    if (!isValid) {
      throw new Error('Invalid TOTP token');
    }

    // Update administrator with secret
    const customFields = administrator.customFields as any;
    await this.connection
      .getRepository(ctx, 'Administrator')
      .update(
        { id: administrator.id },
        { customFields: { ...customFields, totpSecret: tempRecord.secret } },
      );

    // Delete temporary record
    await this.connection
      .getRepository(ctx, TotpSetupTemp)
      .delete({ id: tempRecord.id });

    const result = new EnableTotpResult();
    result.success = true;
    return result;
  }

  @Mutation(() => VerifyTotpLoginResult)
  @Allow(Permission.Public)
  async verifyTotpLogin(
    @Ctx() ctx: RequestContext,
    @Arg('username', () => String) username: string,
    @Arg('token', () => String) token: string,
  ): Promise<VerifyTotpLoginResult> {
    // Find administrator by username
    const administrators = await this.administratorService.findAll(ctx, {
      filter: { emailAddress: { eq: username } },
    });

    if (administrators.items.length === 0) {
      throw new Error('Invalid credentials');
    }

    const administrator = administrators.items[0];
    const customFields = administrator.customFields as any;
    const totpSecret = customFields?.totpSecret;

    if (!totpSecret) {
      throw new Error('TOTP not enabled for this account');
    }

    // Verify TOTP token
    const isValid = authenticator.check(token, totpSecret);
    if (!isValid) {
      throw new Error('Invalid TOTP token');
    }

    const result = new VerifyTotpLoginResult();
    result.success = true;
    return result;
  }

  @Mutation(() => DisableTotpResult)
  @Allow(Permission.Authenticated)
  async disableTotp(
    @Ctx() ctx: RequestContext,
    @Arg('password', () => String) password: string,
  ): Promise<DisableTotpResult> {
    if (!ctx.activeUserId) {
      throw new Error('Not authenticated');
    }
    
    const administrator = await this.administratorService.findOneByUserId(ctx, ctx.activeUserId);
    if (!administrator) {
      throw new Error('Administrator not found');
    }

    // Verify password
    const user = administrator.user;
    const passwordValid = await this.passwordCipher.check(
      password,
      (user as any).passwordHash,
    );
    if (!passwordValid) {
      throw new Error('Invalid password');
    }

    // Remove TOTP secret
    const customFields = administrator.customFields as any;
    await this.connection
      .getRepository(ctx, 'Administrator')
      .update(
        { id: administrator.id },
        { customFields: { ...customFields, totpSecret: null } },
      );

    const result = new DisableTotpResult();
    result.success = true;
    return result;
  }
}
