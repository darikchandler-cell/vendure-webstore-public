import 'reflect-metadata';
import { bootstrap, RequestContext, ChannelService, UserService, AdministratorService } from '@vendure/core';
import { config } from './vendure-config';
import { getFromAddressForChannel, getFromName } from './email-handlers';

/**
 * Script to send test emails using Vendure's EmailService
 * This tests the actual email system that customers and admins will use
 */

const TEST_EMAIL = 'darikchandler@gmail.com';

async function sendVendureTestEmails() {
  console.log('📧 Starting Vendure Email Test Script...');
  console.log(`📬 Recipient: ${TEST_EMAIL}`);
  console.log('');

  // Override port to avoid conflict with running server
  const scriptConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3007, // Use a different port
    },
    plugins: config.plugins?.filter(p => 
      !p.constructor.name.includes('AdminUiPlugin') && 
      !p.constructor.name.includes('AssetServerPlugin')
    ) || [],
  };

  try {
    console.log('🔄 Bootstrapping Vendure...');
    const app = await bootstrap(scriptConfig);
    const channelService = app.get(ChannelService);
    const userService = app.get(UserService);
    const administratorService = app.get(AdministratorService);
    
    // Get EmailService from the app
    // EmailService is provided by EmailPlugin - use the service token
    const { EmailService } = require('@vendure/email-plugin');
    const emailService = app.get(EmailService);

    console.log('✅ Vendure bootstrapped successfully');
    console.log('');

    // Get default channel for RequestContext
    const defaultChannel = await channelService.getDefaultChannel();
    const ctx = new RequestContext({
      apiType: 'admin',
      channel: defaultChannel,
      languageCode: LanguageCode.en,
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
    });

    // Get both channels
    console.log('📡 Getting channels...');
    const channels = await channelService.findAll(ctx);
    const usChannel = channels.items.find(c => c.code?.toLowerCase() === 'us' || c.code?.toLowerCase() === 'us-channel');
    const caChannel = channels.items.find(c => c.code?.toLowerCase() === 'ca' || c.code?.toLowerCase() === 'ca-channel');

    if (!usChannel || !caChannel) {
      console.error('❌ Could not find channels. Available channels:');
      channels.items.forEach(c => console.error(`   - ${c.code} (${c.token})`));
      process.exit(1);
    }

    console.log(`✅ Found US channel: ${usChannel.code} (${usChannel.token})`);
    console.log(`✅ Found CA channel: ${caChannel.code} (${caChannel.token})`);
    console.log('');

    // Create request contexts for both channels
    const usCtx = new RequestContext({
      apiType: 'admin',
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
      channel: usChannel,
    });

    const caCtx = new RequestContext({
      apiType: 'admin',
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
      channel: caChannel,
    });

    const fromName = getFromName();
    const usFromAddress = getFromAddressForChannel(usCtx);
    const caFromAddress = getFromAddressForChannel(caCtx);

    console.log('📤 Channel-Specific From Addresses:');
    console.log(`   US Channel: ${fromName} <${usFromAddress}>`);
    console.log(`   CA Channel: ${fromName} <${caFromAddress}>`);
    console.log('');

    // Test 1: Send a simple test email from US channel
    console.log('📨 Test 1: Sending test email from US channel via EmailService...');
    try {
      await emailService.send({
        from: `${fromName} <${usFromAddress}>`,
        to: TEST_EMAIL,
        subject: 'Vendure Test Email - US Channel',
        template: 'test-email',
        templateVars: {
          channel: 'US',
          fromAddress: usFromAddress,
          fromName: fromName,
          timestamp: new Date().toISOString(),
        },
      }, usCtx);
      console.log('✅ US channel email sent via EmailService!');
    } catch (error: any) {
      console.error('❌ Failed to send US channel email:', error.message);
      // If template doesn't exist, send a simple email
      console.log('   Trying simple email without template...');
      try {
        await emailService.send({
          from: `${fromName} <${usFromAddress}>`,
          to: TEST_EMAIL,
          subject: 'Vendure Test Email - US Channel',
          body: `
            <h2>Test Email from US Channel</h2>
            <p>This is a test email sent via Vendure's EmailService.</p>
            <p><strong>From:</strong> ${fromName} &lt;${usFromAddress}&gt;</p>
            <p><strong>Channel:</strong> US</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          `,
        }, usCtx);
        console.log('✅ US channel simple email sent!');
      } catch (e: any) {
        console.error('❌ Failed to send simple email:', e.message);
      }
    }
    console.log('');

    // Test 2: Send a simple test email from CA channel
    console.log('📨 Test 2: Sending test email from CA channel via EmailService...');
    try {
      await emailService.send({
        from: `${fromName} <${caFromAddress}>`,
        to: TEST_EMAIL,
        subject: 'Vendure Test Email - CA Channel',
        template: 'test-email',
        templateVars: {
          channel: 'CA',
          fromAddress: caFromAddress,
          fromName: fromName,
          timestamp: new Date().toISOString(),
        },
      }, caCtx);
      console.log('✅ CA channel email sent via EmailService!');
    } catch (error: any) {
      console.error('❌ Failed to send CA channel email:', error.message);
      // If template doesn't exist, send a simple email
      console.log('   Trying simple email without template...');
      try {
        await emailService.send({
          from: `${fromName} <${caFromAddress}>`,
          to: TEST_EMAIL,
          subject: 'Vendure Test Email - CA Channel',
          body: `
            <h2>Test Email from CA Channel</h2>
            <p>This is a test email sent via Vendure's EmailService.</p>
            <p><strong>From:</strong> ${fromName} &lt;${caFromAddress}&gt;</p>
            <p><strong>Channel:</strong> CA</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          `,
        }, caCtx);
        console.log('✅ CA channel simple email sent!');
      } catch (e: any) {
        console.error('❌ Failed to send simple email:', e.message);
      }
    }
    console.log('');

    // Test 3: Try to trigger a password reset email (if we can find an admin)
    console.log('📨 Test 3: Attempting to trigger password reset email...');
    try {
      const administrators = await administratorService.findAll(usCtx);
      if (administrators.items.length > 0) {
        const admin = administrators.items[0];
        console.log(`   Found admin: ${admin.emailAddress}`);
        // Note: This would normally be triggered by the password reset flow
        // We'll just log that we found an admin
        console.log('   (Password reset emails are triggered via the admin UI password reset flow)');
      } else {
        console.log('   No administrators found');
      }
    } catch (error: any) {
      console.error('   Error checking administrators:', error.message);
    }
    console.log('');

    console.log('📋 Summary:');
    console.log(`   US From: ${fromName} <${usFromAddress}>`);
    console.log(`   CA From: ${fromName} <${caFromAddress}>`);
    console.log(`   To: ${TEST_EMAIL}`);
    console.log('');
    console.log('✅ Vendure email test complete!');
    console.log('   Check the recipient inbox (and spam folder) for test emails.');
    console.log('');
    console.log('💡 To test customer/admin emails:');
    console.log('   1. Use the admin UI to trigger password reset');
    console.log('   2. Place a test order to trigger order confirmation');
    console.log('   3. Register a new customer to trigger welcome email');

    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

sendVendureTestEmails();

