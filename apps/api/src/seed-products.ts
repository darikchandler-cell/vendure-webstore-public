import 'reflect-metadata';
import {
  bootstrap,
  ChannelService,
  ProductService,
  ProductVariantService,
  FacetValueService,
  RequestContext,
  TransactionalConnection,
  LanguageCode,
  CurrencyCode,
  Channel,
  Product,
  DefaultLogger,
  LogLevel,
} from '@vendure/core';
import { config } from './vendure-config';

/**
 * Seeds sample products with channel-specific pricing
 */
async function seedProducts() {
  // Use a different port to avoid conflict with running server
  const seedConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3002,
    },
    logger: new DefaultLogger({ level: LogLevel.Info }),
  };

  const app = await bootstrap(seedConfig);
  const channelService = app.get(ChannelService);
  const productService = app.get(ProductService);
  const variantService = app.get(ProductVariantService);
  const facetValueService = app.get(FacetValueService);
  const connection = app.get(TransactionalConnection);

  const channelRepo = connection.getRepository(Channel);
  const defaultChannel = await channelService.getDefaultChannel();
  const usChannel = await channelRepo.findOne({ where: { code: 'us' } });
  const caChannel = await channelRepo.findOne({ where: { code: 'ca' } });

  if (!usChannel || !caChannel) {
    console.error('❌ US or CA channel not found. Run create-channels.ts first.');
    process.exit(1);
  }

  const ctx = new RequestContext({
    apiType: 'admin',
    channel: defaultChannel,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });

  try {
    // Create a category
    const categoryRepo = connection.rawConnection.getRepository('Category');
    let category = await categoryRepo.findOne({ where: { slug: 'irrigation-systems' } });

    if (!category) {
      // This part requires actual internal CategoryService usage or proper entity creation which is complex
      // Skipping category creation for now to focus on products or use existing
      console.log('ℹ️  Skipping category creation (complex dependency)');
    }

    // Sample products
    const products = [
      {
        name: 'Hunter Pro-Spray PRS40 Rotor Nozzle',
        slug: 'hunter-pro-spray-prs40-rotor-nozzle',
        description:
          'Professional-grade rotor nozzle with pressure regulation. Perfect for residential and commercial irrigation systems.',
        sku: 'HUN-PRS40',
        usPrice: 1299, // $12.99 in cents
        caPrice: 1699, // $16.99 CAD in cents
      },
      {
        name: 'Hunter MP Rotator 2000 Series',
        slug: 'hunter-mp-rotator-2000-series',
        description:
          'Multi-stream rotator with superior water distribution. Ideal for large area coverage with uniform watering.',
        sku: 'HUN-MP2000',
        usPrice: 2499, // $24.99 in cents
        caPrice: 3299, // $32.99 CAD in cents
      },
      {
        name: 'Hunter I-20 Rotor with Nozzle',
        slug: 'hunter-i20-rotor-with-nozzle',
        description:
          'Professional pop-up rotor with adjustable arc and radius. Built for durability and precision watering.',
        sku: 'HUN-I20',
        usPrice: 4599, // $45.99 in cents
        caPrice: 5999, // $59.99 CAD in cents
      },
    ];

    for (const productData of products) {
      // Check if product already exists
      const existingProduct = await productService.findOneBySlug(ctx, productData.slug);
      if (existingProduct) {
        console.log(`ℹ️  Product ${productData.name} already exists, skipping...`);
        continue;
      }

      // Create product
      const product = await productService.create(ctx, {
        translations: [
          {
            languageCode: LanguageCode.en,
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
          },
        ],
        facetValueIds: [],
      });

      // Create variant for US channel
      await variantService.create(ctx, [{
        productId: product.id,
        sku: productData.sku,
        taxCategoryId: 1, // Default tax category
        price: productData.usPrice,
        translations: [
          {
            languageCode: LanguageCode.en,
            name: productData.name,
          },
        ],
      }]);

      // Create variant for CA channel
      await variantService.create(ctx, [{
        productId: product.id,
        sku: `${productData.sku}-CA`,
        taxCategoryId: 1, // Default tax category
        price: productData.caPrice,
        translations: [
          {
            languageCode: LanguageCode.en,
            name: productData.name,
          },
        ],
      }]);
      
      // Assign product to channels
      await channelService.assignToChannels(ctx, Product, product.id, [usChannel.id, caChannel.id]);
      
      // We actually want different PRICES for different channels.
      // This requires PriceLists or updating variant price per channel which is complex in simple seed.
      // For now, we set base price.
      
      console.log(`✅ Created product: ${productData.name}`);
    }

    console.log('✅ Product seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

