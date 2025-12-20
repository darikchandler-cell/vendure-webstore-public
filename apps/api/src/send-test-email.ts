import 'reflect-metadata';
import { bootstrap, RequestContext, ChannelService } from '@vendure/core';
import { config } from './vendure-config';
import { getFromAddressForChannel, getFromName } from './email-handlers';
import nodemailer from 'nodemailer';

/**
 * Script to send a test email via Vendure's EmailService
 * This verifies that SES/SMTP configuration is working correctly with channel-specific addresses
 */

const TEST_EMAIL = 'darikchandler@gmail.com';

async function sendTestEmail() {
  console.log('📧 Starting Test Email Script...');
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
    const app = await bootstrap(scriptConfig);
    const channelService = app.get(ChannelService);
    
    // Create SMTP transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    // Get both channels
    const usChannel = await channelService.getChannelFromToken('us-channel-token');
    const caChannel = await channelService.getChannelFromToken('ca-channel-token');

    if (!usChannel || !caChannel) {
      console.error('❌ Could not find channels. Make sure channels are created.');
      process.exit(1);
    }

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

    // Send test email from US channel
    console.log('📨 Sending test email from US channel...');
    
    const usEmailResult = await transporter.sendMail({
      from: `${fromName} <${usFromAddress}>`,
      to: TEST_EMAIL,
      subject: 'Test Email from US Channel - Hunter Irrigation Supply',
      html: `
        <h2>Test Email from US Channel</h2>
        <p>This is a test email from the US channel to verify channel-specific email addresses.</p>
        <p><strong>From Address:</strong> ${fromName} &lt;${usFromAddress}&gt;</p>
        <p><strong>Channel:</strong> US</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
      text: `Test Email from US Channel\n\nThis is a test email from the US channel.\nFrom: ${fromName} <${usFromAddress}>\nChannel: US\nTimestamp: ${new Date().toISOString()}`,
    });

    if (usEmailResult) {
      console.log('✅ US channel test email sent successfully!');
      console.log(`   Message ID: ${usEmailResult.messageId}`);
    }

    // Send test email from CA channel
    console.log('');
    console.log('📨 Sending test email from CA channel...');
    
    const caEmailResult = await transporter.sendMail({
      from: `${fromName} <${caFromAddress}>`,
      to: TEST_EMAIL,
      subject: 'Test Email from CA Channel - Hunter Irrigation Supply',
      html: `
        <h2>Test Email from CA Channel</h2>
        <p>This is a test email from the CA channel to verify channel-specific email addresses.</p>
        <p><strong>From Address:</strong> ${fromName} &lt;${caFromAddress}&gt;</p>
        <p><strong>Channel:</strong> CA</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
      text: `Test Email from CA Channel\n\nThis is a test email from the CA channel.\nFrom: ${fromName} <${caFromAddress}>\nChannel: CA\nTimestamp: ${new Date().toISOString()}`,
    });

    if (caEmailResult) {
      console.log('✅ CA channel test email sent successfully!');
      console.log(`   Message ID: ${caEmailResult.messageId}`);
    }

    console.log('');
    console.log('📋 Email Details:');
    console.log(`   US From: ${fromName} <${usFromAddress}>`);
    console.log(`   CA From: ${fromName} <${caFromAddress}>`);
    console.log(`   To: ${TEST_EMAIL}`);
    console.log('');
    console.log('💡 Check the recipient inbox (and spam folder) for both test emails.');
    console.log('   You should see two emails with different from addresses.');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error sending test email:', error);
    console.error('Stack:', error.stack);
    
    // Provide helpful error messages
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
      console.error('');
      console.error('💡 SMTP connection error detected!');
      console.error('   Check:');
      console.error('   1. SMTP_HOST and SMTP_PORT environment variables');
      console.error('   2. SMTP_USER and SMTP_PASS credentials');
      console.error('   3. Network connectivity to SMTP server');
    }
    
    if (error.message?.includes('authentication') || error.message?.includes('login')) {
      console.error('');
      console.error('💡 SMTP authentication error detected!');
      console.error('   Check SMTP_USER and SMTP_PASS credentials');
    }

    process.exit(1);
  }
}

sendTestEmail();

