import nodemailer from 'nodemailer';

/**
 * Simple script to send test emails from both channels
 * This bypasses Vendure bootstrapping and directly tests SMTP/SES
 * 
 * Environment variables needed:
 * - SMTP_HOST (e.g., email-smtp.us-east-1.amazonaws.com)
 * - SMTP_PORT (usually 587)
 * - SMTP_USER (AWS SES SMTP username)
 * - SMTP_PASS (AWS SES SMTP password)
 */

const TEST_EMAIL = 'darikchandler@gmail.com';
const FROM_NAME = 'Hunter Irrigation Supply';
const US_FROM_ADDRESS = 'orders@hunterirrigationsupply.com';
const CA_FROM_ADDRESS = 'orders@hunterirrigation.ca';

async function sendTestEmails() {
  console.log('📧 Starting Simple Test Email Script...');
  console.log(`📬 Recipient: ${TEST_EMAIL}`);
  console.log('');

  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  console.log('📤 SMTP Configuration:');
  console.log(`   Host: ${process.env.SMTP_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.SMTP_PORT || '587'}`);
  console.log(`   User: ${process.env.SMTP_USER || '(not set)'}`);
  console.log('');

  // Test connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');
  } catch (error: any) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('');
    console.error('💡 Check your SMTP configuration:');
    console.error('   - SMTP_HOST');
    console.error('   - SMTP_PORT');
    console.error('   - SMTP_USER');
    console.error('   - SMTP_PASS');
    process.exit(1);
  }

  // Send test email from US channel
  console.log('📨 Sending test email from US channel...');
  console.log(`   From: ${FROM_NAME} <${US_FROM_ADDRESS}>`);
  
  try {
    const usEmailResult = await transporter.sendMail({
      from: `${FROM_NAME} <${US_FROM_ADDRESS}>`,
      to: TEST_EMAIL,
      subject: 'Test Email from US Channel - Hunter Irrigation Supply',
      html: `
        <h2>Test Email from US Channel</h2>
        <p>This is a test email from the US channel to verify channel-specific email addresses.</p>
        <p><strong>From Address:</strong> ${FROM_NAME} &lt;${US_FROM_ADDRESS}&gt;</p>
        <p><strong>Channel:</strong> US (hunterirrigationsupply.com)</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p><em>This email was sent to verify that SES email configuration is working correctly with channel-specific from addresses.</em></p>
      `,
      text: `Test Email from US Channel

This is a test email from the US channel to verify channel-specific email addresses.

From Address: ${FROM_NAME} <${US_FROM_ADDRESS}>
Channel: US (hunterirrigationsupply.com)
Timestamp: ${new Date().toISOString()}

This email was sent to verify that SES email configuration is working correctly with channel-specific from addresses.`,
    });

    console.log('✅ US channel test email sent successfully!');
    console.log(`   Message ID: ${usEmailResult.messageId}`);
    console.log(`   Response: ${usEmailResult.response}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Failed to send US channel email:', error.message);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    console.error('');
  }

  // Send test email from CA channel
  console.log('📨 Sending test email from CA channel...');
  console.log(`   From: ${FROM_NAME} <${CA_FROM_ADDRESS}>`);
  
  try {
    const caEmailResult = await transporter.sendMail({
      from: `${FROM_NAME} <${CA_FROM_ADDRESS}>`,
      to: TEST_EMAIL,
      subject: 'Test Email from CA Channel - Hunter Irrigation Supply',
      html: `
        <h2>Test Email from CA Channel</h2>
        <p>This is a test email from the CA channel to verify channel-specific email addresses.</p>
        <p><strong>From Address:</strong> ${FROM_NAME} &lt;${CA_FROM_ADDRESS}&gt;</p>
        <p><strong>Channel:</strong> CA (hunterirrigation.ca)</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p><em>This email was sent to verify that SES email configuration is working correctly with channel-specific from addresses.</em></p>
      `,
      text: `Test Email from CA Channel

This is a test email from the CA channel to verify channel-specific email addresses.

From Address: ${FROM_NAME} <${CA_FROM_ADDRESS}>
Channel: CA (hunterirrigation.ca)
Timestamp: ${new Date().toISOString()}

This email was sent to verify that SES email configuration is working correctly with channel-specific from addresses.`,
    });

    console.log('✅ CA channel test email sent successfully!');
    console.log(`   Message ID: ${caEmailResult.messageId}`);
    console.log(`   Response: ${caEmailResult.response}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Failed to send CA channel email:', error.message);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    console.error('');
  }

  console.log('📋 Summary:');
  console.log(`   US From: ${FROM_NAME} <${US_FROM_ADDRESS}>`);
  console.log(`   CA From: ${FROM_NAME} <${CA_FROM_ADDRESS}>`);
  console.log(`   To: ${TEST_EMAIL}`);
  console.log('');
  console.log('💡 Check the recipient inbox (and spam folder) for both test emails.');
  console.log('   You should see two emails with different from addresses:');
  console.log(`   - One from ${US_FROM_ADDRESS}`);
  console.log(`   - One from ${CA_FROM_ADDRESS}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Make sure both email addresses are verified in AWS SES:');
  console.log(`   - ${US_FROM_ADDRESS}`);
  console.log(`   - ${CA_FROM_ADDRESS}`);
}

sendTestEmails().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

