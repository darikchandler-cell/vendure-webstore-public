import 'reflect-metadata';
import {
  bootstrap,
  RequestContext,
  ChannelService,
  OrderService,
  CustomerService,
  ProductVariantService,
  PaymentService,
  EventBus,
  OrderPlacedEvent,
  LanguageCode,
  CurrencyCode,
} from '@vendure/core';
import { config } from './vendure-config';

/**
 * Script to test Vendure order emails by simulating a real order
 * This will trigger:
 * 1. Order confirmation email to customer
 * 2. Order notification email to admin
 */

const CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL || 'darikchandler@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hunterirrigationsupply.com';

async function testOrderEmails() {
  console.log('🛒 Testing Vendure Order Emails');
  console.log('================================');
  console.log('');
  console.log(`📧 Customer Email: ${CUSTOMER_EMAIL}`);
  console.log(`📧 Admin Email: ${ADMIN_EMAIL}`);
  console.log('');

  // Override port to avoid conflict with running server
  const scriptConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3008, // Use a different port
    },
    plugins: config.plugins?.filter(p => 
      !p.constructor.name.includes('AdminUiPlugin') && 
      !p.constructor.name.includes('AssetServerPlugin')
    ) || [],
  };

  try {
    console.log('🔄 Bootstrapping Vendure...');
    const app = await bootstrap(scriptConfig);
    const channelService = app.get(ChannelService);
    const orderService = app.get(OrderService);
    const customerService = app.get(CustomerService);
    const productVariantService = app.get(ProductVariantService);
    const paymentService = app.get(PaymentService);
    const eventBus = app.get(EventBus);
    
    console.log('✅ Vendure bootstrapped successfully');
    console.log('');

    // Get default channel for RequestContext
    const defaultChannel = await channelService.getDefaultChannel();
    let adminCtx = new RequestContext({
      apiType: 'admin',
      channel: defaultChannel,
      languageCode: LanguageCode.en,
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
    });

    // Get channels
    console.log('📡 Getting channels...');
    const channels = await channelService.findAll(adminCtx);
    const usChannel = channels.items.find(c => 
      c.code?.toLowerCase() === 'us' || 
      c.code?.toLowerCase() === 'us-channel' ||
      c.token === process.env.US_CHANNEL_TOKEN
    );
    const caChannel = channels.items.find(c => 
      c.code?.toLowerCase() === 'ca' || 
      c.code?.toLowerCase() === 'ca-channel' ||
      c.token === process.env.CA_CHANNEL_TOKEN
    );

    if (!usChannel) {
      console.error('❌ Could not find US channel. Available channels:');
      channels.items.forEach(c => console.error(`   - ${c.code} (${c.token})`));
      await app.close();
      process.exit(1);
    }

    console.log(`✅ Found US channel: ${usChannel.code} (${usChannel.token})`);
    if (caChannel) {
      console.log(`✅ Found CA channel: ${caChannel.code} (${caChannel.token})`);
    }
    console.log('');

    // Use US channel for test order
    const channel = usChannel;
    let ctx = new RequestContext({
      apiType: 'shop',
      channel: channel,
      languageCode: LanguageCode.en,
      isAuthorized: false,
      authorizedAsOwnerOnly: false,
    });

    // Find or create customer
    console.log('👤 Finding or creating customer...');
    let customer;
    try {
      const existingCustomers = await customerService.findAll(ctx, {
        filter: { emailAddress: { eq: CUSTOMER_EMAIL } },
      });

      if (existingCustomers.items.length > 0) {
        customer = existingCustomers.items[0];
        console.log(`✅ Found existing customer: ${customer.emailAddress}`);
      } else {
        // Create new customer
        const createResult = await customerService.create(ctx, {
          firstName: 'Test',
          lastName: 'Customer',
          emailAddress: CUSTOMER_EMAIL,
          phoneNumber: '+1234567890',
        });
        if ('id' in createResult) {
          customer = createResult;
          console.log(`✅ Created new customer: ${customer.emailAddress}`);
        } else {
          throw new Error(`Failed to create customer: ${createResult.errorCode}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error finding/creating customer:', error.message);
      await app.close();
      process.exit(1);
    }
    console.log('');

    // Get customer's active order or create new one
    console.log('🛒 Getting or creating order...');
    let order;
    try {
      // Try to get active order for customer
      if (customer.user?.id) {
        const activeOrder = await orderService.getActiveOrderForUser(ctx, customer.user.id);
        
        if (activeOrder) {
          order = activeOrder;
          console.log(`✅ Found active order: ${order.code || 'No code yet'}`);
        } else {
          // Create new order
          order = await orderService.create(ctx, customer.user.id);
          console.log(`✅ Created new order`);
        }
      } else {
        throw new Error('Customer has no user ID');
      }
    } catch (error: any) {
      console.error('❌ Error getting/creating order:', error.message);
      // Try to create order directly
      try {
        if (customer.user?.id) {
          order = await orderService.create(ctx, customer.user.id);
          console.log(`✅ Created new order (retry)`);
        } else {
          throw new Error('Customer has no user ID');
        }
      } catch (e: any) {
        console.error('❌ Failed to create order:', e.message);
        await app.close();
        process.exit(1);
      }
    }
    console.log('');

    // Find a product variant to add to order
    console.log('📦 Finding product variant to add...');
    let variant;
    try {
      const variants = await productVariantService.findAll(ctx, {
        take: 10,
        filter: { enabled: { eq: true } },
      });

      if (variants.items.length > 0) {
        variant = variants.items[0];
        console.log(`✅ Found product variant: ${variant.name} (${variant.sku})`);
        console.log(`   Price: ${variant.priceWithTax / 100} ${channel.defaultCurrencyCode}`);
      } else {
        console.error('❌ No product variants found. Please seed products first.');
        console.log('   Run: pnpm run seed');
        await app.close();
        process.exit(1);
      }
    } catch (error: any) {
      console.error('❌ Error finding product variant:', error.message);
      await app.close();
      process.exit(1);
    }
    console.log('');

    // Add variant to order
    console.log('➕ Adding product to order...');
    try {
      await orderService.addItemToOrder(ctx, order.id, variant.id, 1);
      console.log('✅ Product added to order');
    } catch (error: any) {
      console.error('❌ Error adding item to order:', error.message);
      await app.close();
      process.exit(1);
    }
    console.log('');

    // Set shipping address
    console.log('📍 Setting shipping address...');
    try {
      await orderService.setShippingAddress(ctx, order.id, {
        fullName: `${customer.firstName} ${customer.lastName}`,
        streetLine1: '123 Test Street',
        city: 'Test City',
        province: 'CA',
        postalCode: '12345',
        countryCode: 'US',
        phoneNumber: ('phoneNumber' in customer ? customer.phoneNumber : undefined) || '+1234567890',
      });
      console.log('✅ Shipping address set');
    } catch (error: any) {
      console.error('⚠️  Warning: Could not set shipping address:', error.message);
      console.log('   Continuing anyway...');
    }
    console.log('');

    // Set shipping method
    console.log('🚚 Setting shipping method...');
    try {
      const shippingMethods = await orderService.getEligibleShippingMethods(ctx, order.id);
      if (shippingMethods.length > 0) {
        await orderService.setShippingMethod(ctx, order.id, [shippingMethods[0].id]);
        console.log(`✅ Shipping method set: ${shippingMethods[0].name}`);
      } else {
        console.error('❌ No shipping methods available');
        await app.close();
        process.exit(1);
      }
    } catch (error: any) {
      console.error('❌ Error setting shipping method:', error.message);
      await app.close();
      process.exit(1);
    }
    console.log('');

    // Apply coupon code (optional - skip if none available)
    console.log('🎟️  Checking for coupon codes...');
    // Skip coupon for now - not critical for email testing
    console.log('   (Skipping coupon - not required)');
    console.log('');

    // Transition order to ArrangingPayment
    console.log('💳 Transitioning order to payment...');
    try {
      if (!order) throw new Error('Order is undefined');
      const transitionResult = await orderService.transitionToState(ctx, order.id, 'ArrangingPayment' as any);
      if ('id' in transitionResult) {
        order = transitionResult;
        console.log('✅ Order transitioned to ArrangingPayment');
      } else {
        throw new Error(`Transition failed: ${transitionResult.errorCode}`);
      }
    } catch (error: any) {
      console.error('❌ Error transitioning order:', error.message);
      await app.close();
      process.exit(1);
    }
    console.log('');

    // Create payment
    console.log('💵 Creating payment...');
    let paymentId: string | undefined;
    try {
      if (!order) throw new Error('Order is undefined');
      // Use OrderService.addPaymentToOrder instead of PaymentService.createPayment
      const paymentResult = await orderService.addPaymentToOrder(ctx, order.id, {
        method: 'standard-payment',
        metadata: {
          test: true,
          testOrder: true,
        },
      });
      if ('id' in paymentResult) {
        paymentId = paymentResult.id.toString();
        console.log(`✅ Payment created: ${paymentId}`);
      } else {
        console.log('⚠️  Payment creation returned error, continuing...');
      }
    } catch (error: any) {
      console.error('❌ Error creating payment:', error.message);
      console.log('   Trying to proceed anyway...');
    }
    console.log('');

    // Settle payment and place order
    console.log('✅ Settling payment and placing order...');
    try {
      // Get the order again to ensure we have latest state
      order = await orderService.findOne(ctx, order.id);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Settle payment (this will trigger order placement)
      if (!order) throw new Error('Order is undefined');
      
      // Get payments for this order - PaymentService doesn't have findAll, use OrderService
      const orderWithPayments = await orderService.findOne(ctx, order.id, ['payments']);
      if (!orderWithPayments) throw new Error('Order not found');

      if (orderWithPayments.payments && orderWithPayments.payments.length > 0) {
        const payment = orderWithPayments.payments[0];
        await paymentService.settlePayment(ctx, payment.id);
        console.log('✅ Payment settled');
      }

      // Transition to PaymentSettled
      const settledResult = await orderService.transitionToState(ctx, order.id, 'PaymentSettled' as any);
      if ('id' in settledResult) {
        order = settledResult;
        console.log('✅ Order transitioned to PaymentSettled');
      } else {
        throw new Error(`Transition failed: ${settledResult.errorCode}`);
      }

      // Finally, transition to Fulfillment (this triggers OrderPlacedEvent)
      const fulfillmentResult = await orderService.transitionToState(ctx, order.id, 'Fulfillment' as any);
      if ('id' in fulfillmentResult) {
        order = fulfillmentResult;
        console.log('✅ Order placed successfully!');
        console.log(`   Order Code: ${order.code}`);
      } else {
        throw new Error(`Transition failed: ${fulfillmentResult.errorCode}`);
      }
      console.log('');
      console.log('📧 Emails should now be sent:');
      console.log(`   - Order confirmation to: ${CUSTOMER_EMAIL}`);
      console.log(`   - Order notification to: ${ADMIN_EMAIL}`);
      if (order) {
        console.log(`   Order Code: ${order.code || 'N/A'}`);
        console.log(`   Total: ${order.totalWithTax ? order.totalWithTax / 100 : 'N/A'} ${channel.defaultCurrencyCode}`);
      }
      console.log('');

    } catch (error: any) {
      console.error('❌ Error placing order:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      console.log('');
      console.log('💡 Alternative: Manually trigger OrderPlacedEvent');
      try {
        // Manually publish OrderPlacedEvent to trigger emails
        if (order) {
          await eventBus.publish(new OrderPlacedEvent(ctx, order));
          console.log('✅ OrderPlacedEvent published manually');
          console.log('📧 Emails should now be sent');
        }
      } catch (e: any) {
        console.error('❌ Error publishing event:', e.message);
      }
    }
    console.log('');

    console.log('📋 Summary:');
    if (order) {
      console.log(`   Order Code: ${order.code || 'N/A'}`);
      console.log(`   Total: ${order.totalWithTax ? order.totalWithTax / 100 : 'N/A'} ${channel.defaultCurrencyCode}`);
    }
    if ('emailAddress' in customer) {
      console.log(`   Customer: ${customer.emailAddress}`);
    }
    console.log(`   Channel: ${channel.code}`);
    console.log('');
    console.log('✅ Order email test complete!');
    console.log('');
    console.log('💡 Check email inboxes:');
    console.log(`   - Customer: ${CUSTOMER_EMAIL}`);
    console.log(`   - Admin: ${ADMIN_EMAIL}`);
    console.log('   (Check spam folders if emails don\'t appear)');
    console.log('');

    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testOrderEmails();


