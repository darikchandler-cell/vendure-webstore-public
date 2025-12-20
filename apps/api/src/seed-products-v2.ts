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
  ProductVariant,
  TaxCategory,
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
  const usChannel = await channelRepo.findOne({ where: { code: 'us' }, relations: ['defaultTaxZone', 'defaultShippingZone'] });
  const caChannel = await channelRepo.findOne({ where: { code: 'ca' }, relations: ['defaultTaxZone', 'defaultShippingZone'] });
  
  const taxCategoryRepo = connection.getRepository(TaxCategory);
  const standardTax = await taxCategoryRepo.findOne({ where: { name: 'US Standard Tax' } });
  const taxCategoryId = standardTax ? standardTax.id : 1;

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
      let product = await productService.findOneBySlug(ctx, productData.slug);
      
      if (product) {
        console.log(`ℹ️  Product ${productData.name} already exists. Ensuring enabled.`);
        await productService.update(ctx, {
            id: product.id,
            enabled: true
        });
      } else {
         console.log(`Creating product ${productData.name}...`);
         product = await productService.create(ctx, {
            enabled: true,
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
      }

      // Refresh product to get variants (in case it was just created with a default variant)
      // We need to cast to any because findOne options signature might vary or need explicit relations
      product = await productService.findOne(ctx, product.id, ['variants']);

      let variant;
      if (product && product.variants && product.variants.length > 0) {
          variant = product.variants[0];
          console.log(`ℹ️  Using existing variant for ${productData.name}`);
          
          // Update the existing variant to match our desired SKU/Price/Name
          await variantService.update(ctx, [{
            id: variant.id,
            sku: productData.sku,
            price: productData.usPrice,
            translations: [{
                languageCode: LanguageCode.en,
                name: productData.name
            }]
          }]);
      } else {
          console.log(`Creating variant for ${productData.name}...`);
          // Create ONE variant (the master variant)
          const variants = await variantService.create(ctx, [{
            productId: product!.id,
            sku: productData.sku,
            taxCategoryId: taxCategoryId,
            price: productData.usPrice, // Default (base) price
            translations: [
              {
                languageCode: LanguageCode.en,
                name: productData.name,
              },
            ],
          }]);
          variant = variants[0];
      }
      
      if (!variant) {
          console.error(`❌ Failed to find or create variant for ${productData.name}`);
          continue;
      }

      // Assign product and variant to channels
      console.log(`Assigning ${productData.name} to US (${usChannel.id}) and CA (${caChannel.id})...`);
      await channelService.assignToChannels(ctx, Product, product!.id, [usChannel.id, caChannel.id]);
      await channelService.assignToChannels(ctx, ProductVariant, variant.id, [usChannel.id, caChannel.id]);
      
      // Update price for US Channel
      const usCtx = new RequestContext({
        apiType: 'admin',
        channel: usChannel,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
        languageCode: LanguageCode.en,
      });

      await variantService.update(usCtx, [{
        id: variant.id,
        price: productData.usPrice,
      }]);

      // Update price for CA Channel
      const caCtx = new RequestContext({
        apiType: 'admin',
        channel: caChannel,
        isAuthorized: true,
        authorizedAsOwnerOnly: false,
        languageCode: LanguageCode.en,
      });

       await variantService.update(caCtx, [{
        id: variant.id,
        price: productData.caPrice,
      }]);
      
      console.log(`✅ Created/Updated product: ${productData.name} with US/CA prices`);
    }

    console.log('✅ Product seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

