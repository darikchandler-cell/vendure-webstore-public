/**
 * WooCommerce to Vendure Product Import Script
 * 
 * Imports products from WooCommerce CSV with SEO optimization,
 * price adjustments, and multi-language support
 */

import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import {
  bootstrap,
  ChannelService,
  ProductService,
  ProductVariantService,
  AssetService,
  CollectionService,
  RequestContext,
  TransactionalConnection,
  LanguageCode,
  Channel,
  Product,
  ProductVariant,
  TaxCategory,
  DefaultLogger,
  LogLevel,
  ListQueryBuilder,
} from '@vendure/core';
import { config } from '../../vendure-config';
import { parseCSV, validateCSV, filterProducts } from './csv-parser';
import { transformProduct } from './product-transformer';
import { processImages, generateBrandSlug } from './utils/asset-handler';

/**
 * Helper function to get MIME type from filename
 */
function getMimeTypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[ext] || 'image/jpeg';
}
import { ImportBrandService } from './vendors/brand-service';
import { ImportCollectionService } from './vendors/collection-service';
import { WooCommerceProduct, ImportedProduct } from './types';

interface ImportOptions {
  csvPath?: string;
  dryRun?: boolean;
  limit?: number;
  skipImages?: boolean;
  languages?: LanguageCode[];
}

interface ImportStats {
  total: number;
  processed: number;
  created: number;
  updated: number;
  errors: number;
  skipped: number;
}

/**
 * Main import function
 */
async function importProducts(options: ImportOptions = {}) {
  const {
    csvPath = path.join(__dirname, '../../../../import-hunter.csv'),
    dryRun = false,
    limit,
    skipImages = false,
    languages = [LanguageCode.en],
  } = options;

  console.log('🚀 Starting WooCommerce to Vendure import...');
  console.log(`📁 CSV Path: ${csvPath}`);
  console.log(`🔍 Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`🌐 Languages: ${languages.join(', ')}`);

  // Bootstrap Vendure
  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3002, // Use different port to avoid conflict
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  const app = await bootstrap(seedConfig);
  const channelService = app.get(ChannelService);
  const productService = app.get(ProductService);
  const variantService = app.get(ProductVariantService);
  const assetService = app.get(AssetService);
  const connection = app.get(TransactionalConnection);

  // Get channels
  const defaultChannel = await channelService.getDefaultChannel();
  const channelRepo = connection.getRepository(Channel);
  const usChannel = await channelRepo.findOne({ where: { code: 'us' } });
  const caChannel = await channelRepo.findOne({ where: { code: 'ca' } });

  if (!usChannel || !caChannel) {
    console.error('❌ US or CA channel not found. Run create-channels.ts first.');
    process.exit(1);
  }

  // Get tax category
  const taxCategoryRepo = connection.getRepository(TaxCategory);
  const standardTax = await taxCategoryRepo.findOne({ where: { name: 'US Standard Tax' } });
  const taxCategoryId = standardTax ? standardTax.id : 1;

  // Create RequestContext
  const ctx = new RequestContext({
    apiType: 'admin',
    channel: defaultChannel,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });

  // Initialize services
  const listQueryBuilder = app.get(ListQueryBuilder);
  // Get BrandService from the app (registered by ProductEnhancementsPlugin)
  // The plugin should have registered it, but if not, we'll create it
  // First, ensure Brand entity is available by importing it
  const { Brand } = await import('../../plugins/product-enhancements/entities/brand.entity');
  const { BrandService: BrandServiceClass } = await import('../../plugins/product-enhancements/brand.service');
  const brandService = new BrandServiceClass(connection, listQueryBuilder);
  const importBrandService = new ImportBrandService(brandService);
  const collectionService = app.get(CollectionService);
  const importCollectionService = new ImportCollectionService(collectionService);

  // Parse CSV
  console.log('\n📖 Parsing CSV file...');
  let wcProducts: WooCommerceProduct[];
  try {
    wcProducts = parseCSV(csvPath);
    console.log(`✅ Parsed ${wcProducts.length} products from CSV`);
  } catch (error) {
    console.error('❌ Error parsing CSV:', error);
    process.exit(1);
  }

  // Validate CSV
  const validation = validateCSV(wcProducts);
  if (!validation.valid) {
    console.error('❌ CSV validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  // Filter products
  const filteredProducts = filterProducts(wcProducts, { publishedOnly: true });
  console.log(`✅ Filtered to ${filteredProducts.length} published products`);
  
  // Filter out products without prices
  const productsWithPrices = filteredProducts.filter(p => p['Regular price'] && p['Regular price'].trim() !== '');
  if (productsWithPrices.length < filteredProducts.length) {
    console.log(`⚠️  Skipped ${filteredProducts.length - productsWithPrices.length} products without prices`);
  }

  // Apply limit if specified
  const productsToProcess = limit ? productsWithPrices.slice(0, limit) : productsWithPrices;
  console.log(`📦 Processing ${productsToProcess.length} products\n`);

  // Collect all unique categories
  const allCategories = new Set<string>();
  productsToProcess.forEach(p => {
    if (p.Categories) {
      allCategories.add(p.Categories);
    }
  });

  // Create collections
  console.log('📁 Creating collections...');
  const collectionMap = await importCollectionService.processCategoryPaths(
    ctx,
    Array.from(allCategories)
  );
  console.log(`✅ Created/found ${collectionMap.size} collections\n`);

  // Create brand map
  const brandMap = new Map<string, string>();

  // Process products
  const stats: ImportStats = {
    total: productsToProcess.length,
    processed: 0,
    created: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
  };

  for (let i = 0; i < productsToProcess.length; i++) {
    const wcProduct = productsToProcess[i];
    const progress = `[${i + 1}/${productsToProcess.length}]`;

    try {
      console.log(`${progress} Processing: ${wcProduct.SKU} - ${wcProduct.Name.substring(0, 50)}...`);

      // Transform product
      const importedProduct = transformProduct(wcProduct, languages);

      // Handle brand (skip if Brand entity not available)
      let brandId: string | undefined;
      if (importedProduct.brand) {
        try {
          if (!brandMap.has(importedProduct.brand)) {
            const manufacturerUrl = importedProduct.manufacturerUrl;
            const id = await importBrandService.createOrFindBrand(ctx, importedProduct.brand, manufacturerUrl);
            if (id) {
              brandMap.set(importedProduct.brand, id);
            }
          }
          brandId = brandMap.get(importedProduct.brand);
        } catch (error: any) {
          // Brand entity not available - skip brand assignment
          if (error.message?.includes('No metadata for "Brand"')) {
            console.warn(`  ⚠️  Brand entity not available, skipping brand assignment for ${importedProduct.brand}`);
          } else {
            throw error;
          }
        }
      }

      if (dryRun) {
        console.log(`  [DRY RUN] Would create product: ${importedProduct.sku}`);
        stats.processed++;
        continue;
      }

      // Process images and upload to S3 (us-west-2)
      let s3ImageUrls: string[] = [];
      let imageFilePaths: string[] = [];
      if (!skipImages && importedProduct.images.length > 0) {
        try {
          const brandSlug = importedProduct.brand 
            ? generateBrandSlug(importedProduct.brand)
            : 'unknown';
          console.log(`  📸 Processing ${importedProduct.images.length} images for S3 upload...`);
          const result = await processImages(
            importedProduct.images,
            brandSlug,
            importedProduct.sku
          );
          s3ImageUrls = result.s3Urls;
          imageFilePaths = result.filePaths;
          console.log(`  ✅ Uploaded ${s3ImageUrls.length} images to S3 (us-west-2)`);
        } catch (error) {
          console.error(`  ⚠️  Error processing images:`, error);
          // Continue with product creation even if images fail
        }
      }

      // Check if product exists
      const englishTranslation = importedProduct.translations.find(t => t.languageCode === LanguageCode.en.toString());
      if (!englishTranslation) {
        console.error(`  ❌ No English translation found`);
        stats.errors++;
        continue;
      }

      let product = await productService.findOneBySlug(ctx, englishTranslation.slug);

      // Create or update product
      if (product) {
        // Update existing product
        await productService.update(ctx, {
          id: product.id,
          enabled: true,
          translations: importedProduct.translations.map(t => ({
            languageCode: t.languageCode as LanguageCode,
            name: t.name,
            slug: t.slug,
            description: t.description,
          })),
          customFields: {
            brandId,
            shortDescription: englishTranslation.shortDescription,
            metaTitle: englishTranslation.metaTitle,
            metaDescription: englishTranslation.metaDescription,
            keywords: importedProduct.tags.join(', '),
            // AEO fields for AI search engines
            useCase: importedProduct.useCase,
            applicationCategory: importedProduct.applicationCategory,
            audience: importedProduct.audience,
            compatibility: importedProduct.compatibility,
            manufacturerUrl: importedProduct.manufacturerUrl,
          },
        });

        const updatedProduct = await productService.findOne(ctx, product.id, ['variants']);
        if (updatedProduct) {
          product = updatedProduct;
        }
        stats.updated++;
        if (product) {
          console.log(`  ✅ Updated product: ${product.name}`);
        }
      } else {
        // Create new product
        product = await productService.create(ctx, {
          enabled: true,
          translations: importedProduct.translations.map(t => ({
            languageCode: t.languageCode as LanguageCode,
            name: t.name,
            slug: t.slug,
            description: t.description,
          })),
          customFields: {
            brandId,
            shortDescription: englishTranslation.shortDescription,
            metaTitle: englishTranslation.metaTitle,
            metaDescription: englishTranslation.metaDescription,
            keywords: importedProduct.tags.join(', '),
            // AEO fields for AI search engines
            useCase: importedProduct.useCase,
            applicationCategory: importedProduct.applicationCategory,
            audience: importedProduct.audience,
            compatibility: importedProduct.compatibility,
            manufacturerUrl: importedProduct.manufacturerUrl,
          },
          facetValueIds: [],
        });

        const createdProduct = await productService.findOne(ctx, product.id, ['variants']);
        if (createdProduct) {
          product = createdProduct;
        }
        stats.created++;
        if (product) {
          console.log(`  ✅ Created product: ${product.name}`);
        }
      }

      // Handle S3 images - create Vendure assets from S3 URLs
      // Files are already uploaded to S3, now create Vendure assets from URLs
      let assetIds: string[] = [];
      if (s3ImageUrls.length > 0) {
        try {
          // Create Vendure assets from S3 URLs
          for (const s3Url of s3ImageUrls) {
            try {
              // Use createFromUrl if available, otherwise skip
              const asset = await (assetService as any).createFromUrl(ctx, s3Url);
              if (asset?.id) {
                assetIds.push(asset.id);
              }
            } catch (error: any) {
              // If createFromUrl doesn't exist, try alternative method
              if (error.message?.includes('createFromUrl is not a function')) {
                console.warn(`  ⚠️  AssetService.createFromUrl not available, skipping asset creation for ${s3Url}`);
              } else {
                console.error(`  ⚠️  Error creating Vendure asset from ${s3Url}:`, error);
              }
            }
          }

          // Clean up temp files
          for (const filepath of imageFilePaths) {
            try {
              fs.unlinkSync(filepath);
            } catch (e) {
              // Ignore cleanup errors
            }
          }

          if (assetIds.length > 0 && product) {
            await productService.update(ctx, {
              id: product.id,
              featuredAssetId: assetIds[0],
              assetIds,
            });
            console.log(`  ✅ Created ${assetIds.length} Vendure assets from S3 URLs`);
          } else if (s3ImageUrls.length > 0) {
            console.log(`  ⚠️  Images uploaded to S3 but Vendure assets not created (${s3ImageUrls.length} images in S3)`);
          }
        } catch (error) {
          console.error(`  ⚠️  Error setting assets:`, error);
        }
      }

      if (!product) {
        console.error(`  ❌ Failed to create or update product`);
        stats.errors++;
        continue;
      }

      // Create/update variant
      let variant = product.variants?.[0];

      if (variant) {
        // Update existing variant
        await variantService.update(ctx, [{
          id: variant.id,
          sku: importedProduct.sku,
          price: importedProduct.regularPrice,
          taxCategoryId,
          translations: importedProduct.translations.map(t => ({
            languageCode: t.languageCode as LanguageCode,
            name: t.name,
          })),
          customFields: {
            upc: importedProduct.upc,
            weight: importedProduct.weight,
            length: importedProduct.length,
            width: importedProduct.width,
            height: importedProduct.height,
          },
        }]);
      } else {
        // Create new variant
        const variants = await variantService.create(ctx, [{
          productId: product.id,
          sku: importedProduct.sku,
          price: importedProduct.regularPrice,
          taxCategoryId,
          translations: importedProduct.translations.map(t => ({
            languageCode: t.languageCode as LanguageCode,
            name: t.name,
          })),
          customFields: {
            upc: importedProduct.upc,
            weight: importedProduct.weight,
            length: importedProduct.length,
            width: importedProduct.width,
            height: importedProduct.height,
          },
        }]);
        variant = variants[0];
      }

      // Assign to channels
      if (product && variant) {
        await channelService.assignToChannels(ctx, Product, product.id, [usChannel.id, caChannel.id]);
        await channelService.assignToChannels(ctx, ProductVariant, variant.id, [usChannel.id, caChannel.id]);
      }

      // Set channel-specific prices
      const usCtx = new RequestContext({
        apiType: 'admin',
        channel: usChannel,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
      });

      await variantService.update(usCtx, [{
        id: variant.id,
        price: importedProduct.regularPrice,
      }]);

      // Calculate CAD price (assuming 1.33 exchange rate, adjust as needed)
      const cadPrice = Math.round(importedProduct.regularPrice * 1.33);

      const caCtx = new RequestContext({
        apiType: 'admin',
        channel: caChannel,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
      });

      await variantService.update(caCtx, [{
        id: variant.id,
        price: cadPrice,
      }]);

      // Assign to collections
      if (product && wcProduct.Categories) {
        const collectionId = collectionMap.get(wcProduct.Categories);
        if (collectionId) {
          await importCollectionService.assignProductToCollection(ctx, String(product.id), collectionId);
        }
      }

      stats.processed++;
    } catch (error) {
      console.error(`  ❌ Error processing product ${wcProduct.SKU}:`, error);
      stats.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`Total products: ${stats.total}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log('='.repeat(60));

  if (!dryRun) {
    console.log('\n✅ Import completed!');
  } else {
    console.log('\n🔍 Dry run completed. No changes were made.');
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    limit: args.find(arg => arg.startsWith('--limit='))?.split('=')[1] ? parseInt(args.find(arg => arg.startsWith('--limit='))!.split('=')[1], 10) : undefined,
    skipImages: args.includes('--skip-images'),
  };

  importProducts(options).catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { importProducts };

