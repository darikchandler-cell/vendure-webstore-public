/**
 * Link S3 Images to Products
 * 
 * This script finds products without assets and links them to images in S3
 * based on the product SKU and brand.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
const envPath = path.join(__dirname, '../../../.env');
dotenv.config({ path: envPath });
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import {
  bootstrap,
  ProductService,
  AssetService,
  RequestContext,
  DefaultLogger,
  LogLevel,
  LanguageCode,
  Asset,
} from '@vendure/core';
import { config } from '../vendure-config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.S3_BUCKET || 'hunter-irrigation-supply';
const S3_REGION = process.env.S3_REGION || 'us-west-2';

/**
 * Get S3 URL for a given key
 */
function getS3Url(s3Key: string): string {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
}

/**
 * Download image from URL to buffer
 */
async function downloadImageToBuffer(imageUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Find S3 images for a product based on SKU and brand
 */
async function findS3Images(sku: string, brandSlug: string): Promise<string[]> {
  const s3Client = new S3Client({ region: S3_REGION });
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const cleanBrandSlug = brandSlug.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const prefix = `products/${cleanBrandSlug}/${cleanSku}/`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    const imageUrls: string[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && /\.(jpg|jpeg|png|gif|webp)$/i.test(object.Key)) {
          imageUrls.push(getS3Url(object.Key));
        }
      }
    }

    return imageUrls.sort(); // Sort to ensure consistent order
  } catch (error) {
    console.error(`Error finding S3 images for ${prefix}:`, error);
    return [];
  }
}

/**
 * Create Vendure asset from S3 URL
 */
async function createAssetFromS3Url(
  s3Url: string,
  assetService: AssetService,
  ctx: RequestContext
): Promise<string | null> {
  try {
    // Download image from S3
    const imageBuffer = await downloadImageToBuffer(s3Url);
    const filename = path.basename(new URL(s3Url).pathname);

    // Create asset using create method
    // Note: Vendure's AssetService.create() may require a stream
    // We'll try with buffer first, then fallback to creating a temp file
    try {
      const asset = await assetService.create(ctx, {
        file: imageBuffer,
        tags: [],
      });

      // CreateAssetResult is a union type - check if it's an Asset
      if (asset && 'id' in asset) {
        return (asset as Asset).id.toString();
      }
    } catch (error: any) {
      // If buffer doesn't work, create temp file and use that
      const tempFile = path.join('/tmp', `asset-${Date.now()}-${filename}`);
      fs.writeFileSync(tempFile, imageBuffer);

      try {
        const fileStream = fs.createReadStream(tempFile);
        const asset = await assetService.create(ctx, {
          file: fileStream,
          tags: [],
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);

        // CreateAssetResult is a union type - check if it's an Asset
        if (asset && 'id' in asset) {
          return (asset as Asset).id.toString();
        }
      } catch (streamError) {
        // Clean up temp file on error
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        throw streamError;
      }
    }

    return null;
  } catch (error: any) {
    console.error(`Error creating asset from ${s3Url}:`, error.message);
    return null;
  }
}

/**
 * Main function to link S3 images to products
 */
async function linkS3ImagesToProducts() {
  console.log('🔗 Linking S3 images to products...');
  console.log(`📦 S3 Bucket: ${S3_BUCKET}`);
  console.log(`🌍 Region: ${S3_REGION}`);

  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3003, // Use different port
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  const app = await bootstrap(seedConfig);
  const productService = app.get(ProductService);
  const assetService = app.get(AssetService);
  const channelService = app.get('ChannelService');
  const defaultChannel = await channelService.getDefaultChannel();
  const ctx = new RequestContext({
    apiType: 'admin',
    channel: defaultChannel,
    languageCode: LanguageCode.en,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });

  try {
    // Get all products
    const products = await productService.findAll(ctx, {
      take: 10000, // Get all products
    });

    console.log(`📦 Found ${products.items.length} products`);

    let linked = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products.items) {
      // Get full product with relations
      const fullProduct = await productService.findOne(ctx, product.id, ['assets', 'featuredAsset', 'variants']);
      if (!fullProduct) {
        skipped++;
        continue;
      }

      // Skip if product already has assets
      if (fullProduct.assets && fullProduct.assets.length > 0) {
        skipped++;
        continue;
      }

      // Get SKU from first variant
      const variant = fullProduct.variants?.[0];
      if (!variant || !variant.sku) {
        console.log(`  ⚠️  Product "${fullProduct.name}" has no SKU, skipping`);
        skipped++;
        continue;
      }

      // Get brand slug from custom fields
      const brandId = (fullProduct.customFields as any)?.brandId;
      if (!brandId) {
        console.log(`  ⚠️  Product "${product.name}" has no brand, skipping`);
        skipped++;
        continue;
      }

      // Find brand slug (we'll need to query Brand entity)
      // For now, try common brand slugs
      const brandSlugs = ['hunter-irrigation', 'fx-luminaire'];
      let foundImages: string[] = [];

      for (const brandSlug of brandSlugs) {
        const images = await findS3Images(variant.sku, brandSlug);
        if (images.length > 0) {
          foundImages = images;
          break;
        }
      }

      if (foundImages.length === 0) {
        console.log(`  ⚠️  No S3 images found for "${fullProduct.name}" (SKU: ${variant.sku})`);
        skipped++;
        continue;
      }

      console.log(`  📸 Found ${foundImages.length} images for "${fullProduct.name}"`);

      // Create assets from S3 URLs
      const assetIds: string[] = [];
      for (const s3Url of foundImages) {
        const assetId = await createAssetFromS3Url(s3Url, assetService, ctx);
        if (assetId) {
          assetIds.push(assetId);
          console.log(`    ✅ Created asset from ${s3Url}`);
        }
      }

      if (assetIds.length > 0) {
        // Update product with assets
        await productService.update(ctx, {
          id: fullProduct.id,
          featuredAssetId: assetIds[0],
          assetIds,
        });
        console.log(`  ✅ Linked ${assetIds.length} assets to "${fullProduct.name}"`);
        linked++;
      } else {
        console.log(`  ⚠️  Failed to create assets for "${fullProduct.name}"`);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Linked: ${linked}`);
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
  linkS3ImagesToProducts()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { linkS3ImagesToProducts };

