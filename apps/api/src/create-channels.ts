import 'reflect-metadata';
import { bootstrap, ChannelService, RequestContext, TransactionalConnection, LanguageCode, CurrencyCode } from '@vendure/core';
import { config } from './vendure-config';

/**
 * Creates the US and CA channels with proper configuration
 */
async function createChannels() {
  // Override port to avoid conflict with running server
  // And remove plugins that might start servers (AdminUI, AssetServer)
  const scriptConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3003,
    },
    plugins: config.plugins?.filter(p => 
      !p.constructor.name.includes('AdminUiPlugin') && 
      !p.constructor.name.includes('AssetServerPlugin')
    ) || [],
  };
  
  const app = await bootstrap(scriptConfig);
  const channelService = app.get(ChannelService);
  const connection = app.get(TransactionalConnection);

  const defaultChannel = await channelService.getDefaultChannel();
  const ctx = new RequestContext({
    apiType: 'admin',
    channel: defaultChannel,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });

  try {
    // Check if channels already exist
    const existingChannels = await connection.rawConnection
      .getRepository('Channel')
      .find();

    const usChannelExists = existingChannels.some((ch: any) => ch.code === 'us');
    const caChannelExists = existingChannels.some((ch: any) => ch.code === 'ca');

    // Find or create default zones
    console.log('🔍 Finding zones...');
    const zoneRepo = connection.getRepository(ctx, 'Zone');
    const allZones = await zoneRepo.find();
    console.log(`✅ Found ${allZones.length} zones`);
    
    // Use existing zones or fallback to first available
    const defaultZone = allZones[0];
    
    if (!defaultZone) {
      console.error('❌ No zones found. Please run seed script first.');
      process.exit(1);
    }

    const usZone = allZones.find((z: any) => z.name === 'USA' || z.name === 'Americas' || z.name === 'United States') || defaultZone;
    const caZone = allZones.find((z: any) => z.name === 'Canada' || z.name === 'North America') || defaultZone;
    
    console.log(`🇺🇸 US Zone: ${usZone.name}`);
    console.log(`🇨🇦 CA Zone: ${caZone.name}`);

    if (!usChannelExists) {
      console.log('Creating US Channel...');
      try {
        const usChannelResult = await channelService.create(ctx, {
          code: 'us',
          token: 'us-channel-token',
          defaultLanguageCode: LanguageCode.en,
          currencyCode: CurrencyCode.USD,
          pricesIncludeTax: false,
          defaultShippingZoneId: usZone.id,
          defaultTaxZoneId: usZone.id,
        });
        console.log('✅ Created US channel:', (usChannelResult as any).code);
      } catch (e) {
        console.error('❌ Error creating US channel:', e);
      }
    } else {
      console.log('ℹ️  US channel already exists');
    }

    if (!caChannelExists) {
      console.log('Creating CA Channel...');
      try {
        const caChannelResult = await channelService.create(ctx, {
          code: 'ca',
          token: 'ca-channel-token',
          defaultLanguageCode: LanguageCode.en,
          currencyCode: CurrencyCode.CAD,
          pricesIncludeTax: false,
          defaultShippingZoneId: caZone.id,
          defaultTaxZoneId: caZone.id,
        });
        console.log('✅ Created CA channel:', (caChannelResult as any).code);
      } catch (e) {
        console.error('❌ Error creating CA channel:', e);
      }
    } else {
      console.log('ℹ️  CA channel already exists');
    }

    console.log('✅ Channel setup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating channels:', error);
    process.exit(1);
  }
}

createChannels();

