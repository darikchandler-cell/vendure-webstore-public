/**
 * Sync Tax Rates with Email Notification
 * 
 * This script syncs tax rates from annual rate tables and sends email notification
 * to orders@hollowventures.com when complete or if it fails.
 * 
 * Usage:
 *   pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates-with-email.ts
 * 
 * Scheduled: Runs January 1st every year via cron
 */

import 'reflect-metadata';
import {
  bootstrap,
  TaxRateService,
  ZoneService,
  ChannelService,
  RequestContext,
  TransactionalConnection,
  DefaultLogger,
  LogLevel,
  EventBus,
} from '@vendure/core';
import { config } from '../vendure-config';
import { TaxRateApiService, TaxRateApiConfig } from '../plugins/tax-rate-api/tax-rate-api.service';
import { getFromAddressForChannel, getFromName } from '../email-handlers';

const NOTIFICATION_EMAIL = 'orders@hollowventures.com';

/**
 * Send email notification using Vendure's EmailService
 * This uses the same SMTP configuration and channel-specific logic as customer emails
 */
async function sendEmailNotification(
  emailService: any, // EmailService from @vendure/email-plugin
  ctx: RequestContext,
  subject: string,
  body: string,
  isError: boolean = false
): Promise<void> {
  try {
    // Use channel-specific from address (same logic as customer emails)
    const fromAddress = getFromAddressForChannel(ctx);
    const fromName = getFromName();
    
    await emailService.send({
      from: `${fromName} <${fromAddress}>`,
      to: NOTIFICATION_EMAIL,
      subject: isError ? `❌ ${subject}` : `✅ ${subject}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isError ? '#d32f2f' : '#2e7d32'};">
            ${isError ? '❌ Tax Rate Sync Failed' : '✅ Tax Rate Sync Completed'}
          </h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${body}</pre>
          </div>
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from the Vendure tax rate sync job.
          </p>
          <p style="color: #666; font-size: 12px;">
            Job scheduled to run: January 1st, 12:00 AM (yearly)
          </p>
        </div>
      `,
    }, ctx);

    console.log(`✅ Email notification sent to ${NOTIFICATION_EMAIL} from ${fromAddress}`);
  } catch (error: any) {
    console.error('❌ Failed to send email notification:', error.message);
    // Don't throw - we still want the sync to complete even if email fails
  }
}

async function syncTaxRates() {
  const startTime = Date.now();
  const logMessages: string[] = [];
  
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    logMessages.push(logMessage);
  };

  log('🔄 Starting annual tax rate sync...');

  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3002,
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  let app: any;
  let success = false;
  let errorMessage = '';
  let ctx: RequestContext | null = null;
  let emailService: any = null;

  try {
    app = await bootstrap(seedConfig);
    const taxRateService = app.get(TaxRateService);
    const zoneService = app.get(ZoneService);
    const connection = app.get(TransactionalConnection);
    
    // Get EmailService - it's provided by EmailPlugin
    const { EmailService } = require('@vendure/email-plugin');
    emailService = app.get(EmailService);

    // Create TaxRateApiService instance
    const taxApiService = new TaxRateApiService(
      taxRateService,
      zoneService,
      connection
    );

    const channelService = app.get(ChannelService);
    const defaultChannel = await channelService.getDefaultChannel();
    ctx = new RequestContext({
      apiType: 'admin',
      channel: defaultChannel,
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
    });

    // Get zones
    const zoneRepo = connection.getRepository('Zone');
    const usZone = await zoneRepo.findOne({ where: { name: 'United States' } });
    const caZone = await zoneRepo.findOne({ where: { name: 'Canada' } });

    if (!usZone || !caZone) {
      throw new Error('US or CA zone not found. Run setup-tax-zones.ts first.');
    }

    log('📊 Using annual rate tables (free, no API required)');
    log('');

    // Sync US tax rates
    log('🇺🇸 Syncing US tax rates...');
    await taxApiService.syncTaxRatesForZone(
      ctx,
      usZone.id,
      'United States',
      {
        provider: 'salestaxapi',
        apiKey: '',
        useLiveRates: false,
      }
    );
    log('✅ US tax rates synced');

    // Sync Canadian tax rates
    log('🇨🇦 Syncing Canadian tax rates...');
    await taxApiService.syncTaxRatesForZone(
      ctx,
      caZone.id,
      'Canada',
      {
        provider: 'salestaxapi',
        apiKey: '',
        useLiveRates: false,
      }
    );
    log('✅ Canadian tax rates synced');

    // Get final counts
    const allRates = await taxRateService.findAll(ctx);
    const enabledRates = allRates.items.filter((r: any) => r.enabled);
    const usRates = enabledRates.filter((r: any) => r.name.includes('US'));
    const caRates = enabledRates.filter((r: any) => r.name.includes('CA'));

    log('');
    log(`📊 Summary:`);
    log(`   Total tax rates: ${allRates.items.length}`);
    log(`   Enabled rates: ${enabledRates.length}`);
    log(`   US rates: ${usRates.length}`);
    log(`   Canadian rates: ${caRates.length}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`⏱️  Duration: ${duration} seconds`);
    log('');
    log('✅ Tax rate sync completed successfully!');

    success = true;

    // Send success email using Vendure's EmailService
    const emailBody = logMessages.join('\n') + `\n\nDuration: ${duration} seconds\nStatus: SUCCESS`;
    await sendEmailNotification(
      emailService,
      ctx,
      'Tax Rate Sync Completed Successfully',
      emailBody,
      false
    );

    await app.close();
    process.exit(0);
  } catch (error: any) {
    errorMessage = error.message || String(error);
    log(`❌ Error: ${errorMessage}`);
    log('');
    log('Stack trace:');
    log(error.stack || 'No stack trace available');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`⏱️  Duration: ${duration} seconds`);
    log('');
    log('❌ Tax rate sync failed!');

    success = false;

    // Send error email using Vendure's EmailService
    if (app && ctx) {
      try {
        const { EmailService } = require('@vendure/email-plugin');
        const emailService = app.get(EmailService);
        const emailBody = logMessages.join('\n') + `\n\nDuration: ${duration} seconds\nStatus: FAILED\nError: ${errorMessage}`;
        await sendEmailNotification(
          emailService,
          ctx,
          'Tax Rate Sync Failed',
          emailBody,
          true
        );
      } catch (emailError: any) {
        console.error('Failed to send error email:', emailError.message);
      }
    }

    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

syncTaxRates().catch(async (err) => {
  console.error('❌ Fatal error:', err);
  // Try to bootstrap just to send email, but don't fail if it doesn't work
  try {
    const seedConfig = {
      ...config,
      apiOptions: {
        ...config.apiOptions,
        port: 3002,
      },
      logger: new DefaultLogger({ level: LogLevel.Error }),
    };
    const app = await bootstrap(seedConfig);
    // Get EmailService - same pattern as send-vendure-test-email.ts
    const { EmailService } = require('@vendure/email-plugin');
    const emailService = app.get(EmailService);
    const channelService = app.get(ChannelService);
    const defaultChannel = await channelService.getDefaultChannel();
    const ctx = new RequestContext({
      apiType: 'admin',
      channel: defaultChannel,
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
    });
    await sendEmailNotification(
      emailService,
      ctx,
      'Tax Rate Sync - Fatal Error',
      `Fatal error occurred:\n\n${err.message}\n\n${err.stack || ''}`,
      true
    );
    await app.close();
  } catch (emailError) {
    console.error('Failed to send error email:', emailError);
  }
  process.exit(1);
});

