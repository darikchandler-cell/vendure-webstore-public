import 'reflect-metadata';
import { bootstrap, RequestContext, ChannelService, ProductService, LanguageCode, TransactionalConnection } from '@vendure/core';
import { config } from './vendure-config';

async function checkVariantImages() {
  const app = await bootstrap({
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3009,
    },
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

    // Get all products with variants
    const products = await productService.findAll(ctx, {
      take: 10,
      relations: ['variants', 'variants.featuredAsset', 'featuredAsset'],
    });

    console.log(`\n📦 Checking ${products.items.length} products...\n`);

    for (const product of products.items) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`  Product featuredAsset: ${product.featuredAsset ? product.featuredAsset.preview : 'NONE'}`);
      console.log(`  Variants: ${product.variants.length}`);
      
      for (const variant of product.variants) {
        const variantAsset = (variant as any).featuredAsset;
        console.log(`    Variant ${variant.sku}: ${variantAsset ? variantAsset.preview : 'NO IMAGE'}`);
      }
    }

    // Check database directly
    console.log('\n\n🔍 Checking database directly...\n');
    const rawConnection = connection.rawConnection;
    
    const variantsWithAssets = await rawConnection.query(`
      SELECT 
        pv.id,
        pv.sku,
        pv."featuredAssetId",
        a.preview,
        a.source
      FROM product_variant pv
      LEFT JOIN asset a ON pv."featuredAssetId" = a.id
      WHERE pv."featuredAssetId" IS NOT NULL
      LIMIT 10
    `);

    console.log(`Variants with featuredAssetId: ${variantsWithAssets.length}`);
    for (const v of variantsWithAssets) {
      console.log(`  ${v.sku}: ${v.preview || v.source || 'NO PREVIEW'}`);
    }

    const variantsWithoutAssets = await rawConnection.query(`
      SELECT COUNT(*) as count
      FROM product_variant
      WHERE "featuredAssetId" IS NULL
    `);
    console.log(`\nVariants WITHOUT featuredAssetId: ${variantsWithoutAssets[0].count}`);

    await app.close();
  } catch (error: any) {
    console.error('Error:', error.message);
    await app.close();
    process.exit(1);
  }
}

checkVariantImages();
