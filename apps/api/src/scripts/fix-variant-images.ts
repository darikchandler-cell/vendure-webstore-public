/**
 * Fix Variant Images
 * Ensures all product variants have featured assets linked
 */

import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  bootstrap,
  RequestContext,
  ChannelService,
  ProductService,
  LanguageCode,
  TransactionalConnection,
  DefaultLogger,
  LogLevel,
} from '@vendure/core';
import { config } from '../../vendure-config';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function fixVariantImages() {
  console.log('🔧 Fixing variant images...\n');

  const app = await bootstrap({
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3010,
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
    plugins: config.plugins?.filter(p => 
      !p.constructor.name.includes('AdminUiPlugin') && 
      !p.constructor.name.includes('AssetServerPlugin')
    ) || [],
  });

  try {
    const channelService = app.get(ChannelService);
    const productService = app.get(ProductService);
    const connection = app.get(TransactionalConnection);
    const defaultChannel = await channelService.getDefaultChannel();
    
    const ctx = new RequestContext({
      apiType: 'admin',
      channel: defaultChannel,
      languageCode: LanguageCode.en,
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
    });

    const rawConnection = connection.rawConnection;

    // First, check current status
    console.log('📊 Checking current status...\n');
    
    const variantsWithoutAssets = await rawConnection.query(`
      SELECT COUNT(*) as count
      FROM product_variant
      WHERE "featuredAssetId" IS NULL
    `);
    
    const variantsWithAssets = await rawConnection.query(`
      SELECT COUNT(*) as count
      FROM product_variant
      WHERE "featuredAssetId" IS NOT NULL
    `);

    console.log(`  Variants WITH featuredAssetId: ${variantsWithAssets[0].count}`);
    console.log(`  Variants WITHOUT featuredAssetId: ${variantsWithoutAssets[0].count}\n`);

    // Get all products with their variants and assets
    console.log('🔍 Finding products and variants...\n');
    
    const products = await productService.findAll(ctx, {
      take: 10000,
      relations: ['variants', 'featuredAsset'],
    });

    console.log(`  Found ${products.items.length} products\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products.items) {
      // Get product's featured asset
      const productAssetId = (product as any).featuredAssetId;
      
      if (!productAssetId) {
        skipped++;
        continue;
      }

      // Get all variants for this product
      const variants = await rawConnection.query(`
        SELECT id, sku, "featuredAssetId"
        FROM product_variant
        WHERE "productId" = $1
      `, [product.id]);

      for (const variant of variants) {
        // If variant already has a featured asset, skip
        if (variant.featuredAssetId) {
          skipped++;
          continue;
        }

        try {
          // Set variant's featuredAssetId to product's featured asset
          await rawConnection.query(
            `UPDATE product_variant SET "featuredAssetId" = $1 WHERE id = $2`,
            [productAssetId, variant.id]
          );

          // Also ensure the asset is linked via product_variant_asset join table
          // Check if link already exists
          const existingLink = await rawConnection.query(`
            SELECT id FROM product_variant_asset 
            WHERE "productVariantId" = $1 AND "assetId" = $2
          `, [variant.id, productAssetId]);

          if (existingLink.length === 0) {
            // Link asset to variant via join table
            await rawConnection.query(
              `INSERT INTO product_variant_asset ("productVariantId", "assetId", position) 
               VALUES ($1, $2, $3) 
               ON CONFLICT DO NOTHING`,
              [variant.id, productAssetId, 0]
            );
          }

          fixed++;
          if (fixed <= 10) {
            console.log(`  ✅ Fixed variant ${variant.sku} (Product: ${product.name})`);
          }
        } catch (error: any) {
          errors++;
          if (errors <= 5) {
            console.error(`  ⚠️  Error fixing variant ${variant.sku}: ${error.message}`);
          }
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Fixed: ${fixed} variants`);
    console.log(`  ⏭️  Skipped: ${skipped} variants (already have assets)`);
    console.log(`  ❌ Errors: ${errors}`);

    // Verify final status
    console.log('\n🔍 Verifying final status...\n');
    
    const finalVariantsWithoutAssets = await rawConnection.query(`
      SELECT COUNT(*) as count
      FROM product_variant
      WHERE "featuredAssetId" IS NULL
    `);
    
    const finalVariantsWithAssets = await rawConnection.query(`
      SELECT COUNT(*) as count
      FROM product_variant
      WHERE "featuredAssetId" IS NOT NULL
    `);

    console.log(`  Variants WITH featuredAssetId: ${finalVariantsWithAssets[0].count}`);
    console.log(`  Variants WITHOUT featuredAssetId: ${finalVariantsWithoutAssets[0].count}`);

    if (finalVariantsWithoutAssets[0].count === 0) {
      console.log('\n✅ All variants now have images!');
    } else {
      console.log(`\n⚠️  ${finalVariantsWithoutAssets[0].count} variants still need images`);
    }

    await app.close();
    console.log('\n✅ Done!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await app.close();
    process.exit(1);
  }
}

fixVariantImages();

