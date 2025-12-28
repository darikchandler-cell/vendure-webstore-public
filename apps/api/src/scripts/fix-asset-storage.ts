/**
 * Fix Asset Storage - Copy S3 images to local storage
 * 
 * This script fixes existing assets that have S3 URLs stored but need
 * to be in Vendure's local asset storage for the AssetServerPlugin to serve them.
 */

import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import {
  bootstrap,
  AssetService,
  ChannelService,
  RequestContext,
  DefaultLogger,
  LogLevel,
  LanguageCode,
  Asset,
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
 * Fix asset storage - copy from S3 to local storage
 */
async function fixAssetStorage() {
  console.log('🔧 Fixing asset storage - copying S3 images to local storage...');
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
    // Get all assets that have S3 URLs
    const assetRepo = connection.getRepository(ctx, Asset);
    const allAssets = await assetRepo.find();
    
    console.log(`📦 Found ${allAssets.length} total assets`);

    const assetUploadDir = path.join(process.cwd(), 'static', 'assets');
    
    // Ensure directory exists
    if (!fsRequire.existsSync(assetUploadDir)) {
      fsRequire.mkdirSync(assetUploadDir, { recursive: true });
    }

    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    let httpUrlsFound = 0;
    let sampleHttpUrls: string[] = [];

    for (const asset of allAssets) {
      const source = (asset as any).source;
      const preview = (asset as any).preview;

      // Skip if no source
      if (!source) {
        skipped++;
        continue;
      }

      // Track HTTP URLs for debugging
      if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
        httpUrlsFound++;
        if (sampleHttpUrls.length < 5) {
          sampleHttpUrls.push(`${(asset as any).name}: ${source.substring(0, 100)}`);
        }
      }

      // Check if asset already has local storage (not a URL)
      if (typeof source === 'string' && !source.startsWith('http://') && !source.startsWith('https://')) {
        // Already using local storage
        skipped++;
        continue;
      }

      // This asset has an HTTP/HTTPS URL - needs to be fixed
      if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
        try {
          console.log(`  🔧 Fixing asset: ${(asset as any).name} (ID: ${(asset as any).id})`);
          
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
          const originalFilename = (asset as any).name || 'image';
          const ext = path.extname(originalFilename) || '.webp';
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const uniqueFilename = `${timestamp}-${randomStr}-${originalFilename}`;
          const targetPath = path.join(assetUploadDir, uniqueFilename);

          // Copy file to asset directory
          fsRequire.writeFileSync(targetPath, imageBuffer);

          // Update asset with local filename
          await assetRepo.update(
            { id: (asset as any).id },
            {
              source: uniqueFilename,
              preview: uniqueFilename,
            }
          );

          console.log(`  ✅ Fixed asset: ${originalFilename} -> ${uniqueFilename}`);
          fixed++;
        } catch (error: any) {
          console.error(`  ⚠️  Failed to fix asset ${(asset as any).name}: ${error.message}`);
          errors++;
        }
      } else {
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  🔗 HTTP URLs found: ${httpUrlsFound}`);
    if (sampleHttpUrls.length > 0) {
      console.log(`  📋 Sample HTTP URLs:`);
      sampleHttpUrls.forEach(url => console.log(`     - ${url}`));
    }
    console.log(`  ✅ Fixed: ${fixed}`);
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
  fixAssetStorage()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}


