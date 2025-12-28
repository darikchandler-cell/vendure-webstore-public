/**
 * Test Asset URL - Verify a specific asset is accessible via HTTP
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
// Using require for node-fetch to avoid TypeScript issues
const fetch = require('node-fetch');

async function testAssetUrl() {
  console.log('🧪 Testing asset URL accessibility...');

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
    
    // Get a sample asset
    const assets = await rawConnection.query(`
      SELECT id, name, "mimeType", source, preview 
      FROM asset 
      WHERE source NOT LIKE 'http://%' 
        AND source NOT LIKE 'https://%'
        AND source IS NOT NULL
        AND source != ''
      LIMIT 1
    `);
    
    if (assets.length === 0) {
      console.log('❌ No assets found');
      await app.close();
      process.exit(1);
    }

    const asset = assets[0];
    console.log(`\n📦 Testing asset: ${asset.name}`);
    console.log(`   Source: ${asset.source}`);
    console.log(`   Preview: ${asset.preview}`);
    console.log(`   MIME Type: ${asset.mimeType}`);

    // Test if file exists on disk
    const assetUploadDir = path.join(process.cwd(), 'static', 'assets');
    const filePath = path.join(assetUploadDir, asset.source);
    const fs = require('fs');
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   ✅ File exists on disk (${stats.size} bytes)`);
    } else {
      console.log(`   ❌ File NOT found on disk: ${filePath}`);
    }

    // Test HTTP access (if server is running)
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const assetUrl = `${baseUrl}${asset.preview}`;
    console.log(`\n🌐 Testing HTTP access: ${assetUrl}`);
    
    try {
      const response = await fetch(assetUrl, { method: 'HEAD', timeout: 5000 });
      if (response.ok) {
        console.log(`   ✅ Asset is accessible via HTTP (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      } else {
        console.log(`   ⚠️  HTTP request returned ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.log(`   ⚠️  Could not test HTTP access (server may not be running): ${error.message}`);
      console.log(`   💡 Make sure Vendure server is running to test HTTP access`);
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
  testAssetUrl()
    .then(() => {
      console.log('\n✅ Test complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

