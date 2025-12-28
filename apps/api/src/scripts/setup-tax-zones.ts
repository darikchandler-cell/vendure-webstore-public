/**
 * Setup Tax Zones for Channels
 * Ensures US and CA channels have proper tax zones configured
 */

import 'reflect-metadata';
import {
  bootstrap,
  ChannelService,
  ZoneService,
  RequestContext,
  TransactionalConnection,
  LanguageCode,
  CurrencyCode,
  Channel,
  Zone,
  DefaultLogger,
  LogLevel,
} from '@vendure/core';
import { config } from '../vendure-config';

async function setupTaxZones() {
  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3002,
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  const app = await bootstrap(seedConfig);
  const channelService = app.get(ChannelService);
  const zoneService = app.get(ZoneService);
  const connection = app.get(TransactionalConnection);

  const defaultChannel = await channelService.getDefaultChannel();
  const ctx = new RequestContext({
    apiType: 'admin',
    channel: defaultChannel,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });

  // Get channels
  const channelRepo = connection.getRepository(Channel);
  const usChannel = await channelRepo.findOne({ 
    where: { code: 'us' },
    relations: ['defaultTaxZone', 'defaultShippingZone']
  });
  const caChannel = await channelRepo.findOne({ 
    where: { code: 'ca' },
    relations: ['defaultTaxZone', 'defaultShippingZone']
  });

  if (!usChannel || !caChannel) {
    console.error('❌ US or CA channel not found. Run create-channels.ts first.');
    process.exit(1);
  }

  // Get or create zones
  const zoneRepo = connection.getRepository(Zone);
  let usZone = await zoneRepo.findOne({ where: { name: 'United States' } });
  let caZone = await zoneRepo.findOne({ where: { name: 'Canada' } });

  // Get Country entities first
  const countryRepo = connection.getRepository(ctx, 'Country');
  let usCountry = await countryRepo.findOne({ where: { code: 'US' } });
  let caCountry = await countryRepo.findOne({ where: { code: 'CA' } });

  // Create zones if they don't exist
  if (!usZone) {
    console.log('Creating US Zone...');
    // First ensure US country exists
    if (!usCountry) {
      usCountry = await countryRepo.save({
        code: 'US',
        name: 'United States',
        enabled: true,
      });
    }
    usZone = await zoneService.create(ctx, {
      name: 'United States',
      memberIds: [usCountry.id],
    });
    console.log('✅ Created US Zone');
  }

  if (!caZone) {
    console.log('Creating CA Zone...');
    // First ensure CA country exists
    if (!caCountry) {
      caCountry = await countryRepo.save({
        code: 'CA',
        name: 'Canada',
        enabled: true,
      });
    }
    caZone = await zoneService.create(ctx, {
      name: 'Canada',
      memberIds: [caCountry.id],
    });
    console.log('✅ Created CA Zone');
  }

  // Update channels with tax zones
  const usTaxZoneId = usChannel.defaultTaxZone?.id || (usChannel as any).defaultTaxZoneId;
  const caTaxZoneId = caChannel.defaultTaxZone?.id || (caChannel as any).defaultTaxZoneId;

  if (usTaxZoneId !== usZone.id) {
    console.log('Updating US channel tax zone...');
    await channelService.update(ctx, {
      id: usChannel.id,
      defaultTaxZoneId: usZone.id,
      defaultShippingZoneId: usZone.id,
    });
    console.log('✅ Updated US channel tax zone');
  }

  if (caTaxZoneId !== caZone.id) {
    console.log('Updating CA channel tax zone...');
    await channelService.update(ctx, {
      id: caChannel.id,
      defaultTaxZoneId: caZone.id,
      defaultShippingZoneId: caZone.id,
    });
    console.log('✅ Updated CA channel tax zone');
  }

  console.log('✅ Tax zones configured successfully!');
  process.exit(0);
}

setupTaxZones().catch(err => {
  console.error('❌ Error setting up tax zones:', err);
  process.exit(1);
});

