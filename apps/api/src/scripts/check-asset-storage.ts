/**
 * Check Asset Storage - Verify asset source/preview fields
 */

import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import {
  bootstrap,
  ChannelService,
  RequestContext,
  DefaultLogger,
  LogLevel,
  LanguageCode,
  Asset,
  TransactionalConnection,
} from '@vendure/core';
import { config } from '../vendure-config';

async function checkAssetStorage() {
  console.log('🔍 Checking asset storage...');

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
    const assetRepo = connection.getRepository(ctx, Asset);
    const allAssets = await assetRepo.find();
    
    console.log(`📦 Total assets: ${allAssets.length}`);

    const assetUploadDir = path.join(process.cwd(), 'static', 'assets');
    console.log(`📁 Asset directory: ${assetUploadDir}`);
    console.log(`📁 Directory exists: ${fs.existsSync(assetUploadDir)}`);

    if (fs.existsSync(assetUploadDir)) {
      const files = fs.readdirSync(assetUploadDir);
      console.log(`📁 Files in directory: ${files.length}`);
    }

    let s3Urls = 0;
    let localFiles = 0;
    let httpUrls = 0;
    let missingFiles = 0;

    for (const asset of allAssets) {
      const source = (asset as any).source;
      const preview = (asset as any).preview;

      if (source && source.includes('s3.amazonaws.com')) {
        s3Urls++;
      } else if (source && (source.startsWith('http://') || source.startsWith('https://'))) {
        httpUrls++;
      } else if (source && !source.includes('http')) {
        localFiles++;
        // Check if file exists
        const filePath = path.join(assetUploadDir, source);
        if (!fs.existsSync(filePath)) {
          missingFiles++;
          if (missingFiles <= 5) {
            console.log(`  ⚠️  Missing file: ${source}`);
          }
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  🔗 S3 URLs: ${s3Urls}`);
    console.log(`  🌐 HTTP URLs: ${httpUrls}`);
    console.log(`  📁 Local files: ${localFiles}`);
    console.log(`  ❌ Missing files: ${missingFiles}`);

    // Show sample assets
    console.log('\n📋 Sample assets:');
    for (let i = 0; i < Math.min(5, allAssets.length); i++) {
      const asset = allAssets[i];
      const source = (asset as any).source;
      const preview = (asset as any).preview;
      console.log(`  ${i + 1}. ${(asset as any).name}`);
      console.log(`     Source: ${source ? source.substring(0, 80) : 'null'}`);
      console.log(`     Preview: ${preview ? preview.substring(0, 80) : 'null'}`);
    }

    await app.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await app.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkAssetStorage()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

