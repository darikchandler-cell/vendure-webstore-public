/**
 * Fix Asset Storage - Using Raw SQL to fix HTTP URLs
 * 
 * This script uses raw SQL to directly query and update assets,
 * bypassing any TypeORM transformations that might be hiding HTTP URLs.
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
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.S3_BUCKET || 'hunter-irrigation-supply';
const S3_REGION = process.env.S3_REGION || 'us-west-2';

// Use require for fs
const fsRequire = require('fs');

/**
 * Initialize S3 client
 */
function getS3Client(): S3Client {
  return new S3Client({
    region: S3_REGION,
  });
}

/**
 * Download image from S3 using AWS SDK
 */
async function downloadImageFromS3(s3Key: string): Promise<Buffer> {
  const s3Client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error('No body in S3 response');
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Extract S3 key from URL
 */
function extractS3KeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove leading slash and extract path
    return urlObj.pathname.substring(1);
  } catch (e) {
    // If it's already a key, return as-is
    return url;
  }
}

/**
 * Fix asset storage using raw SQL
 */
async function fixAssetStorageRawSQL() {
  console.log('🔧 Fixing asset storage using raw SQL...');
  console.log(`📦 S3 Bucket: ${S3_BUCKET}`);
  console.log(`🌍 Region: ${S3_REGION}`);

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
    
    // Get all assets with HTTP URLs using raw SQL
    const httpAssets = await rawConnection.query(`
      SELECT id, name, "mimeType", source, preview 
      FROM asset 
      WHERE source LIKE 'http://%' OR source LIKE 'https://%'
      LIMIT 2000
    `);
    
    console.log(`📦 Found ${httpAssets.length} assets with HTTP URLs`);

    const assetUploadDir = path.join(process.cwd(), 'static', 'assets');
    
    // Ensure directory exists
    if (!fsRequire.existsSync(assetUploadDir)) {
      fsRequire.mkdirSync(assetUploadDir, { recursive: true });
    }

    let fixed = 0;
    let errors = 0;

    for (const asset of httpAssets) {
      const source = asset.source;
      const assetId = asset.id;
      const assetName = asset.name || 'image';

      try {
        console.log(`  🔧 Fixing asset: ${assetName} (ID: ${assetId})`);
        
        let imageBuffer: Buffer;
        
        // Check if it's an S3 URL
        if (source.includes('s3.amazonaws.com') || source.includes('s3.us-west-2.amazonaws.com')) {
          // Download from S3 using AWS SDK
          const s3Key = extractS3KeyFromUrl(source);
          imageBuffer = await downloadImageFromS3(s3Key);
        } else {
          // Download from external HTTP/HTTPS URL
          const fetch = require('node-fetch');
          const response = await fetch(source);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          imageBuffer = Buffer.from(await response.arrayBuffer());
        }
        
        // Generate unique filename
        const ext = path.extname(assetName) || '.webp';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const uniqueFilename = `${timestamp}-${randomStr}-${assetName}`;
        const targetPath = path.join(assetUploadDir, uniqueFilename);

        // Copy file to asset directory
        fsRequire.writeFileSync(targetPath, imageBuffer);

        // Update asset with local filename using raw SQL
        await rawConnection.query(
          `UPDATE asset SET source = $1, preview = $2 WHERE id = $3`,
          [uniqueFilename, uniqueFilename, assetId]
        );

        console.log(`  ✅ Fixed asset: ${assetName} -> ${uniqueFilename}`);
        fixed++;
      } catch (error: any) {
        console.error(`  ⚠️  Failed to fix asset ${assetName}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Fixed: ${fixed}`);
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
  fixAssetStorageRawSQL()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

