import 'reflect-metadata';
import { bootstrap, RequestContext, AdministratorService, PasswordCipher, TransactionalConnection } from '@vendure/core';
import { config } from './vendure-config';
import { authenticator } from 'otplib';
import * as readline from 'readline';
import * as qrcode from 'qrcode';
import { TotpSetupTemp } from './plugins/totp-mfa/entities/totp-setup-temp.entity';

/**
 * Interactive script to set up TOTP MFA for your admin account
 */
async function setupTotpMfa() {
  console.log('🔐 TOTP MFA Setup Script');
  console.log('========================\n');

  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    // Bootstrap the app
    console.log('⏳ Starting Vendure server...');
    const app = await bootstrap(config);
    console.log('✅ Server started\n');

    // Get services
    const administratorService = app.get(AdministratorService);
    const passwordCipher = app.get(PasswordCipher);
    const connection = app.get(TransactionalConnection);

    // Get admin credentials
    const email = await question('Enter your admin email: ');
    const password = await question('Enter your admin password: ');
    console.log('');

    // Create a request context
    const channel = await app.get('ChannelService').getDefaultChannel();
    const ctx = new RequestContext({
      apiType: 'admin',
      channel,
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
    });

    // Find administrator
    console.log('🔍 Finding administrator...');
    const administrators = await administratorService.findAll(ctx, {
      filter: { emailAddress: { eq: email } },
    });

    if (administrators.items.length === 0) {
      console.error('❌ Administrator not found with that email');
      rl.close();
      await app.close();
      process.exit(1);
    }

    const administrator = administrators.items[0];
    console.log('✅ Administrator found\n');

    // Verify password
    console.log('🔑 Verifying password...');
    const user = administrator.user;
    const passwordValid = await passwordCipher.check(
      password,
      (user as any).passwordHash,
    );

    if (!passwordValid) {
      console.error('❌ Invalid password');
      rl.close();
      await app.close();
      process.exit(1);
    }
    console.log('✅ Password verified\n');

    // Check if already enabled
    const customFields = administrator.customFields as any;
    if (customFields?.totpSecret) {
      console.log('⚠️  TOTP is already enabled for this account');
      const disable = await question('Do you want to disable and re-setup? (yes/no): ');
      if (disable.toLowerCase() !== 'yes') {
        console.log('Cancelled');
        rl.close();
        await app.close();
        process.exit(0);
      }
    }

    // Generate new secret
    console.log('📱 Generating TOTP secret...');
    const secret = authenticator.generateSecret();
    const serviceName = 'Vendure Admin';
    const accountName = administrator.emailAddress;
    const qrCodeUri = authenticator.keyuri(accountName, serviceName, secret);
    console.log('✅ Secret generated\n');

    // Store temporarily in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing temp records for this admin
    await connection
      .getRepository(ctx, TotpSetupTemp)
      .delete({ administratorId: Number(administrator.id) });

    const tempRecord = connection.getRepository(ctx, TotpSetupTemp).create({
      administratorId: Number(administrator.id),
      secret,
      expiresAt,
    });

    await connection.getRepository(ctx, TotpSetupTemp).save(tempRecord);

    // Display QR code
    console.log('📱 QR Code for your authenticator app:');
    console.log('=====================================\n');
    
    try {
      const qrCodeString = await qrcode.toString(qrCodeUri, { type: 'terminal', small: true });
      console.log(qrCodeString);
    } catch (err) {
      console.log('(QR code display failed, but you can still use the secret below)');
    }

    console.log('\n📝 Manual Entry Option:');
    console.log('   Account: Vendure Admin');
    console.log('   Secret:', secret);
    console.log('   Type: Time-based (TOTP)\n');

    console.log('📲 Instructions:');
    console.log('   1. Open Google Authenticator, Microsoft Authenticator, or Authy on your phone');
    console.log('   2. Tap "Add account" or the "+" button');
    console.log('   3. Choose "Scan QR code" and scan the code above');
    console.log('      OR choose "Enter a setup key" and use the secret above');
    console.log('   4. Wait for the 6-digit code to appear\n');

    // Verify and enable
    const token = await question('Enter the 6-digit code from your authenticator app: ');
    console.log('');

    console.log('✅ Verifying code...');
    
    // Get temporary secret
    const tempRecordCheck = await connection
      .getRepository(ctx, TotpSetupTemp)
      .findOne({
        where: { administratorId: Number(administrator.id) },
        order: { createdAt: 'DESC' },
      });

    if (!tempRecordCheck) {
      console.error('❌ TOTP setup not found. Please start over.');
      rl.close();
      await app.close();
      process.exit(1);
    }

    // Check if expired
    if (new Date() > tempRecordCheck.expiresAt) {
      await connection
        .getRepository(ctx, TotpSetupTemp)
        .delete({ id: tempRecordCheck.id });
      console.error('❌ TOTP setup expired. Please start over.');
      rl.close();
      await app.close();
      process.exit(1);
    }

    // Verify token
    const isValid = authenticator.check(token, tempRecordCheck.secret);
    if (!isValid) {
      console.error('❌ Invalid TOTP token. Please try again.');
      rl.close();
      await app.close();
      process.exit(1);
    }

    // Update administrator with secret
    await connection
      .getRepository(ctx, 'Administrator')
      .update(
        { id: administrator.id },
        { customFields: { ...customFields, totpSecret: tempRecordCheck.secret } },
      );

    // Delete temporary record
    await connection
      .getRepository(ctx, TotpSetupTemp)
      .delete({ id: tempRecordCheck.id });

    console.log('🎉 SUCCESS! Two-factor authentication is now enabled!');
    console.log('\n📌 Important:');
    console.log('   - From now on, you will need both your password AND the 6-digit code to log in');
    console.log('   - Keep your authenticator app secure');
    console.log('   - If you lose access to your phone, you may need to disable MFA via database\n');

    rl.close();
    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

setupTotpMfa();
