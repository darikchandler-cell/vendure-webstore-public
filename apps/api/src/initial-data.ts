import { InitialData, LanguageCode, Permission, dummyPaymentHandler } from '@vendure/core';

export const initialData: InitialData = {
  defaultLanguage: LanguageCode.en,
  defaultZone: 'United States',
  taxRates: [
    { name: 'US Standard Tax', percentage: 0 },
    { name: 'US Sales Tax', percentage: 8.5 },
    { name: 'CA GST', percentage: 5 },
    { name: 'CA HST', percentage: 13 },
  ],
  shippingMethods: [
    {
      name: 'Standard Shipping',
      price: 1000, // $10.00 in cents
    },
    {
      name: 'Express Shipping',
      price: 2500, // $25.00 in cents
    },
  ],
  paymentMethods: [
    {
      name: 'Standard Payment',
      handler: {
        code: dummyPaymentHandler.code,
        arguments: [
          { name: 'automaticSettle', value: 'true' },
        ],
      },
    },
  ],
  countries: [
    { name: 'United States', code: 'US', zone: 'United States' },
    { name: 'Canada', code: 'CA', zone: 'Canada' },
  ],
  collections: [
    {
      name: 'Featured Products',
      slug: 'featured',
      description: 'Our featured products',
      filters: [],
      assetPaths: [],
    },
  ],
};

