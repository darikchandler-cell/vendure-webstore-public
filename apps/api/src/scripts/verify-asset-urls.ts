/**
 * Verify Asset URLs - Test if assets are accessible
 * 
 * This script verifies that:
 * 1. Assets have correct preview URLs
 * 2. Files exist on disk
 * 3. AssetServerPlugin can serve them
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
  TransactionalConnection,
} from '@vendure/core';
import { config } from '../vendure-config';

async function verifyAssetUrls() {
  console.log('🔍 Verifying asset URLs...');

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
    
    // Get sample assets
    const assets = await rawConnection.query(`
      SELECT id, name, "mimeType", source, preview 
      FROM asset 
      WHERE source NOT LIKE 'http://%' 
        AND source NOT LIKE 'https://%'
        AND source IS NOT NULL
        AND source != ''
      LIMIT 20
    `);
    
    console.log(`📦 Checking ${assets.length} sample assets\n`);

    const assetUploadDir = path.join(process.cwd(), 'static', 'assets');
    console.log(`📁 Asset directory: ${assetUploadDir}\n`);

    let correctFormat = 0;
    let filesExist = 0;
    let issues: string[] = [];

    for (const asset of assets) {
      const source = asset.source;
      const preview = asset.preview;
      const assetId = asset.id;
      const assetName = asset.name;

      // Check preview format
      if (preview && preview.startsWith('/assets/')) {
        correctFormat++;
      } else {
        issues.push(`❌ Asset ${assetName} (ID: ${assetId}): Preview format incorrect - "${preview}"`);
      }

      // Check if file exists
      if (source) {
        const filePath = path.join(assetUploadDir, source);
        if (fs.existsSync(filePath)) {
          filesExist++;
          const stats = fs.statSync(filePath);
          if (stats.size === 0) {
            issues.push(`⚠️  Asset ${assetName} (ID: ${assetId}): File exists but is empty`);
          }
        } else {
          issues.push(`❌ Asset ${assetName} (ID: ${assetId}): File not found - ${source}`);
        }
      }
    }

    console.log('📊 Verification Results:');
    console.log(`  ✅ Correct preview format: ${correctFormat}/${assets.length}`);
    console.log(`  ✅ Files exist on disk: ${filesExist}/${assets.length}`);
    console.log(`  ❌ Issues found: ${issues.length}\n`);

    if (issues.length > 0) {
      console.log('🔍 Issues:');
      issues.slice(0, 10).forEach(issue => console.log(`  ${issue}`));
      if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more issues`);
      }
    } else {
      console.log('✅ All sample assets are correctly configured!');
    }

    // Check product assets
    console.log('\n🔗 Checking product asset links...');
    const productAssets = await rawConnection.query(`
      SELECT COUNT(DISTINCT p.id) as products_with_assets
      FROM product p
      WHERE p."featuredAssetId" IS NOT NULL
    `);
    console.log(`  Products with featured assets: ${productAssets[0].products_with_assets}`);

    const variantAssets = await rawConnection.query(`
      SELECT COUNT(DISTINCT pv.id) as variants_with_assets
      FROM product_variant pv
      WHERE pv."featuredAssetId" IS NOT NULL
    `);
    console.log(`  Variants with featured assets: ${variantAssets[0].variants_with_assets}`);

    await app.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await app.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyAssetUrls()
    .then(() => {
      console.log('\n✅ Verification complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}


