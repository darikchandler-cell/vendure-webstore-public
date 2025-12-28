/**
 * Fix Asset Preview URLs
 * 
 * Vendure's AssetServerPlugin expects preview URLs to be in the format:
 * /assets/{filename}
 * 
 * This script updates all assets to have the correct preview URL format.
 */

import 'reflect-metadata';
import * as path from 'path';
import {
  bootstrap,
  ChannelService,
  RequestContext,
  DefaultLogger,
  LogLevel,
  LanguageCode,
  TransactionalConnection,
} from '@vendure/core';
import { config } from '../vendure-config';

async function fixAssetPreviewUrls() {
  console.log('🔧 Fixing asset preview URLs...');

  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3003,
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  const app = await bootstrap(seedConfig);
  const connection = app.get(TransactionalConnection);
  const channelService = app.get(ChannelService);
  const defaultChannel = await channelService.getDefaultChannel();
  const ctx = new RequestContext({
    apiType: 'admin',
    channel: defaultChannel,
    languageCode: LanguageCode.en,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });

  try {
    const rawConnection = connection.rawConnection;
    
    // Get all assets that have local filenames (not URLs)
    const assets = await rawConnection.query(`
      SELECT id, name, source, preview 
      FROM asset 
      WHERE source NOT LIKE 'http://%' 
        AND source NOT LIKE 'https://%'
        AND source IS NOT NULL
        AND source != ''
    `);
    
    console.log(`📦 Found ${assets.length} assets with local filenames`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const asset of assets) {
      const source = asset.source;
      const preview = asset.preview;
      const assetId = asset.id;

      try {
        // Check if preview already has /assets/ prefix
        if (preview && (preview.startsWith('/assets/') || preview.startsWith('assets/'))) {
          skipped++;
          continue;
        }

        // Update preview to be /assets/{filename}
        // Vendure's AssetServerPlugin serves from /assets route
        const previewUrl = `/assets/${source}`;

        await rawConnection.query(
          `UPDATE asset SET preview = $1 WHERE id = $2`,
          [previewUrl, assetId]
        );

        if (updated < 5) {
          console.log(`  ✅ Updated asset ${asset.name}: ${preview} -> ${previewUrl}`);
        }
        updated++;
      } catch (error: any) {
        console.error(`  ⚠️  Failed to update asset ${asset.name}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);

    await app.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await app.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixAssetPreviewUrls()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

