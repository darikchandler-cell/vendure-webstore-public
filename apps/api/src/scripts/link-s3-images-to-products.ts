/**
 * Link S3 Images to Products
 * 
 * This script finds products without assets and links them to images in S3
 * based on the product SKU and brand.
 */

import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import {
  bootstrap,
  ProductService,
  AssetService,
  ChannelService,
  RequestContext,
  DefaultLogger,
  LogLevel,
  LanguageCode,
  Asset,
} from '@vendure/core';
import { config } from '../vendure-config';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.S3_BUCKET || 'hunter-irrigation-supply';
const S3_REGION = process.env.S3_REGION || 'us-west-2';

/**
 * Get S3 URL for a given key
 */
function getS3Url(s3Key: string): string {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${s3Key}`;
}

/**
 * Download image from S3 using AWS SDK (bucket is private)
 */
async function downloadImageFromS3(s3Key: string): Promise<Buffer> {
  const s3Client = new S3Client({ region: S3_REGION });
  
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No body in S3 response');
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error: any) {
    throw new Error(`Failed to download from S3: ${error.message}`);
  }
}

/**
 * Extract S3 key from S3 URL
 */
function extractS3KeyFromUrl(s3Url: string): string {
  // URL format: https://bucket.s3.region.amazonaws.com/key
  const url = new URL(s3Url);
  // Remove leading slash from pathname
  return url.pathname.substring(1);
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
 * Helper function to create Vendure asset from file
 * Tries buffer first (which seems to work), then falls back to stream
 * This is based on the import script but tries buffer first
 */
async function createAssetFromFile(
  filepath: string,
  assetService: AssetService,
  ctx: RequestContext
): Promise<string | null> {
  if (!fs.existsSync(filepath)) {
    console.error(`     File not found: ${filepath}`);
    return null;
  }

  const filename = path.basename(filepath);
  
  // Try buffer first (some Vendure setups work better with buffer)
  try {
    const fileBuffer = fs.readFileSync(filepath);
    const asset = await (assetService as any).create(ctx, {
      file: fileBuffer,
      tags: [],
    });

    if (asset && (asset as any).id) {
      console.log(`  ✅ Created asset from buffer: ${filename} (ID: ${(asset as any).id})`);
      return (asset as any).id.toString();
    }
  } catch (bufferError: any) {
    // If buffer doesn't work, try with stream
    try {
      const fileStream = fs.createReadStream(filepath);
      const asset = await assetService.create(ctx, {
        file: fileStream as any,
        tags: [],
      });

      if (asset && (asset as any).id) {
        console.log(`  ✅ Created asset from stream: ${filename} (ID: ${(asset as any).id})`);
        return (asset as any).id.toString();
      }
    } catch (streamError: any) {
      // If both fail, log and return null
      console.error(`     Failed to create asset from ${filepath}:`);
      console.error(`     Buffer error: ${bufferError.message}`);
      console.error(`     Stream error: ${streamError.message}`);
      return null;
    }
  }
  return null;
}

/**
 * Create Vendure asset from S3 URL
 * Downloads from S3 using AWS SDK (bucket is private) then uses createAssetFromFile
 */
async function createAssetFromS3Url(
  s3Url: string,
  assetService: AssetService,
  ctx: RequestContext
): Promise<string | null> {
  let tempFile: string | null = null;
  try {
    // Extract S3 key from URL and download using AWS SDK (bucket is private)
    const s3Key = extractS3KeyFromUrl(s3Url);
    const imageBuffer = await downloadImageFromS3(s3Key);
    const filename = path.basename(new URL(s3Url).pathname);

    // Create temp file - ensure it's fully written before using
    tempFile = path.join('/tmp', `asset-${Date.now()}-${Math.random().toString(36).substring(7)}-${filename}`);
    fs.writeFileSync(tempFile, imageBuffer);
    
    // Ensure file is fully written and readable
    if (!fs.existsSync(tempFile)) {
      throw new Error(`Temp file was not created: ${tempFile}`);
    }

    // Use the same createAssetFromFile function that works in the import script
    const assetId = await createAssetFromFile(tempFile, assetService, ctx);

    // Clean up temp file after asset creation
    if (tempFile && fs.existsSync(tempFile)) {
      // Wait a bit to ensure file is not in use
      setTimeout(() => {
        try {
          fs.unlinkSync(tempFile!);
        } catch (e) {
          // Ignore cleanup errors - file might be in use
        }
      }, 500);
    }

    return assetId;
  } catch (error: any) {
    // Clean up temp file on error
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    console.error(`     Error creating asset from ${s3Url}: ${error.message}`);
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
    // Get all products (Vendure has a max limit, so we'll paginate)
    const products = await productService.findAll(ctx, {
      take: 1000, // Max allowed by Vendure
      skip: 0,
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

      // Infer brand from product name if not in custom fields
      let brandSlug: string | null = null;
      const productName = fullProduct.name.toLowerCase();
      
      if (productName.includes('hunter') || productName.includes('hunter irrigation')) {
        brandSlug = 'hunter-irrigation';
      } else if (productName.includes('fx luminaire') || productName.includes('fx-luminaire')) {
        brandSlug = 'fx-luminaire';
      } else if (productName.includes('regency wire')) {
        brandSlug = 'regency-wire';
      } else if (productName.includes('paige electric')) {
        brandSlug = 'paige-electric';
      } else if (productName.includes('3m')) {
        brandSlug = '3m';
      }

      // If still no brand, try common brand slugs
      const brandSlugs = brandSlug ? [brandSlug] : ['hunter-irrigation', 'fx-luminaire'];
      let foundImages: string[] = [];

      for (const slug of brandSlugs) {
        const images = await findS3Images(variant.sku, slug);
        if (images.length > 0) {
          foundImages = images;
          brandSlug = slug;
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

