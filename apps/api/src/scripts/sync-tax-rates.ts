/**
 * Sync Tax Rates from Public APIs
 * 
 * This script syncs tax rates from public APIs (SalesTaxAPI, Ziptax, etc.)
 * or uses annual rate tables for US and Canadian tax rates.
 * 
 * Usage:
 *   pnpm exec ts-node -r tsconfig-paths/register src/scripts/sync-tax-rates.ts
 * 
 * Environment Variables:
 *   TAX_API_PROVIDER=salestaxapi|ziptax|taxdata|zip2tax (optional, defaults to annual rates)
 *   TAX_API_KEY=your-api-key (required if using API provider)
 *   TAX_USE_LIVE_RATES=true|false (default: false for annual rates)
 */

import 'reflect-metadata';
import {
  bootstrap,
  TaxRateService,
  ZoneService,
  RequestContext,
  TransactionalConnection,
  DefaultLogger,
  LogLevel,
} from '@vendure/core';
import { config } from '../vendure-config';
import { TaxRateApiService, TaxRateApiConfig } from '../plugins/tax-rate-api/tax-rate-api.service';

async function syncTaxRates() {
  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3002,
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  const app = await bootstrap(seedConfig);
  const taxRateService = app.get(TaxRateService);
  const zoneService = app.get(ZoneService);
  const connection = app.get(TransactionalConnection);

  // Create TaxRateApiService instance
  const taxApiService = new TaxRateApiService(
    taxRateService,
    zoneService,
    connection
  );

  const defaultChannel = await app.get('ChannelService').getDefaultChannel();
  const ctx = new RequestContext({
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
    console.error('❌ US or CA zone not found. Run setup-tax-zones.ts first.');
    process.exit(1);
  }

  // Get API configuration from environment
  const apiProvider = process.env.TAX_API_PROVIDER as 'salestaxapi' | 'ziptax' | 'taxdata' | 'zip2tax' | undefined;
  const apiKey = process.env.TAX_API_KEY;
  const useLiveRates = process.env.TAX_USE_LIVE_RATES === 'true';

  const apiConfig: TaxRateApiConfig | undefined = apiProvider && apiKey
    ? {
        provider: apiProvider,
        apiKey,
        useLiveRates,
        cacheDuration: useLiveRates
          ? 24 * 60 * 60 * 1000 // 24 hours
          : 365 * 24 * 60 * 60 * 1000, // 1 year
      }
    : undefined;

  console.log('🔄 Syncing tax rates...');
  console.log(`   Provider: ${apiConfig ? apiConfig.provider : 'Annual rates (no API)'}`);
  console.log(`   Mode: ${apiConfig?.useLiveRates ? 'Live rates' : 'Annual rates'}`);
  console.log('');

  try {
    // Sync US tax rates
    console.log('🇺🇸 Syncing US tax rates...');
    await taxApiService.syncTaxRatesForZone(
      ctx,
      usZone.id,
      'United States',
      apiConfig || {
        provider: 'salestaxapi',
        apiKey: '',
        useLiveRates: false,
      },
      undefined // No specific zip codes - use default state rates
    );
    console.log('✅ US tax rates synced');

    // Sync Canadian tax rates
    console.log('🇨🇦 Syncing Canadian tax rates...');
    await taxApiService.syncTaxRatesForZone(
      ctx,
      caZone.id,
      'Canada',
      apiConfig || {
        provider: 'salestaxapi',
        apiKey: '',
        useLiveRates: false,
      }
    );
    console.log('✅ Canadian tax rates synced');

    console.log('');
    console.log('✅ Tax rate sync completed!');
    console.log('');
    console.log('💡 To use live rates, set environment variables:');
    console.log('   export TAX_API_PROVIDER=salestaxapi');
    console.log('   export TAX_API_KEY=your-api-key');
    console.log('   export TAX_USE_LIVE_RATES=true');
    console.log('');
    console.log('📚 Available providers:');
    console.log('   - salestaxapi.io (recommended)');
    console.log('   - platform.zip.tax');
    console.log('   - taxdata.io');
    console.log('   - zip2tax.com');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing tax rates:', error);
    process.exit(1);
  }
}

syncTaxRates().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

