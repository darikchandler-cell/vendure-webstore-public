import { BootstrapWorker, VendureConfig } from '@vendure/core';
import { config } from './vendure-config';
import { ChannelService, ProductService, RequestContext, ProductVariantService, Channel, LanguageCode, CurrencyCode } from '@vendure/core';

/**
 * Script to assign all products to the CA channel and set CAD prices
 */
async function assignProductsToCaChannel() {
    // Initialize Vendure
    const bootstrap = new BootstrapWorker(config);
    const app = await bootstrap.initApp();
    
    try {
        const channelService = app.get(ChannelService);
        const productService = app.get(ProductService);
        const productVariantService = app.get(ProductVariantService);
        
        console.log('🔄 Finding channels...');
        
        // Get Default (US) and CA channels
        const defaultChannel = await channelService.getChannelFromToken('us-channel-token');
        const caChannel = await channelService.getChannelFromToken('ca-channel-token');
        
        if (!defaultChannel) {
            console.error('❌ US Channel (us-channel-token) not found');
            // Try finding by code if token fails
            const allChannels = await channelService.findAll(new RequestContext({
                apiType: 'admin',
                isAuthorized: true,
                authorizedAsOwnerOnly: false,
                channel: new Channel(),
                languageCode: LanguageCode.en,
            }));
            console.log('Available channels:', allChannels.items.map(c => `${c.code} (${c.token})`));
            return;
        }
        
        if (!caChannel) {
            console.error('❌ CA Channel (ca-channel-token) not found');
            return;
        }

        console.log(`✅ Found Channels: US (${defaultChannel.id}), CA (${caChannel.id})`);

        // Create RequestContext for Admin
        const ctx = new RequestContext({
            apiType: 'admin',
            isAuthorized: true,
            authorizedAsOwnerOnly: false,
            channel: defaultChannel,
            languageCode: LanguageCode.en,
        });

        // 1. Get all products from Default Channel
        console.log('📦 Fetching all products from US channel...');
        const products = await productService.findAll(ctx, { take: 1000 });
        console.log(`   Found ${products.items.length} products`);

        // 2. Assign products and variants to CA Channel
        console.log('🔄 Assigning products to CA channel...');
        
        for (const product of products.items) {
            // Assign product to CA channel
            await channelService.assignToChannels(ctx, Product, product.id, [caChannel.id]);
            
            // Fetch variants for this product
            const variants = await productVariantService.getVariantsByProductId(ctx, product.id);
            
            for (const variant of variants) {
                // Assign variant to CA channel
                await channelService.assignToChannels(ctx, ProductVariant, variant.id, [caChannel.id]);
                
                // Set CAD price (simple 1.3x conversion for now)
                // Round up to nearest 0.10 (tenth)
                const usPrice = variant.price;
                const cadPriceRaw = usPrice * 1.3;
                const cadPrice = Math.ceil((cadPriceRaw / 100) * 10) / 10 * 100;
                
                // Update price for CA channel
                // Note: This creates a price for the specific channel
                await productVariantService.update(ctx, [{
                    id: variant.id,
                    prices: [
                        {
                            currencyCode: CurrencyCode.USD,
                            price: usPrice
                        },
                        {
                            currencyCode: CurrencyCode.CAD,
                            price: cadPrice
                        }
                    ]
                }]);
            }
        }
        
        console.log('✅ All products assigned to CA channel with CAD pricing');
        
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await app.close();
    }
}

// Helper classes for type safety in assignToChannels
class Product {}
class ProductVariant {}

assignProductsToCaChannel();

