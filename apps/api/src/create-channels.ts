import 'reflect-metadata';
import { bootstrap, ChannelService, RequestContext, TransactionalConnection } from '@vendure/core';
import { config } from './vendure-config';

/**
 * Creates the US and CA channels with proper configuration
 */
async function createChannels() {
  const app = await bootstrap(config);
  const channelService = app.get(ChannelService);
  const connection = app.get(TransactionalConnection);

  const ctx = new RequestContext({
    apiType: 'admin' as any,
    channelOrToken: await channelService.getDefaultChannel(),
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

    if (!usChannelExists) {
      const usChannel = await channelService.create(ctx, {
        code: 'us',
        token: process.env.US_CHANNEL_TOKEN || 'us-channel-token',
        defaultLanguageCode: 'en',
        currencyCode: 'USD',
        pricesIncludeTax: false,
        defaultShippingZone: { id: 1 }, // Assuming zone ID 1 is US
        defaultTaxZone: { id: 1 },
      });
      console.log('✅ Created US channel:', usChannel.code);
    } else {
      console.log('ℹ️  US channel already exists');
    }

    if (!caChannelExists) {
      const caChannel = await channelService.create(ctx, {
        code: 'ca',
        token: process.env.CA_CHANNEL_TOKEN || 'ca-channel-token',
        defaultLanguageCode: 'en',
        currencyCode: 'CAD',
        pricesIncludeTax: false,
        defaultShippingZone: { id: 2 }, // Assuming zone ID 2 is CA
        defaultTaxZone: { id: 2 },
      });
      console.log('✅ Created CA channel:', caChannel.code);
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

