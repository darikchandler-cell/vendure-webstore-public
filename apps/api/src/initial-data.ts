import { InitialData, LanguageCode, Permission } from '@vendure/core';

export const initialData: InitialData = {
  defaultLanguage: LanguageCode.en,
  defaultZone: 'North America',
  taxRates: [
    { name: 'US Standard Tax', percentage: 0 },
    { name: 'US Sales Tax', percentage: 8.5 },
    { name: 'CA GST', percentage: 5 },
    { name: 'CA HST', percentage: 13 },
  ],
  taxZones: [
    {
      name: 'United States',
      members: [{ code: 'US', name: 'United States' }],
    },
    {
      name: 'Canada',
      members: [{ code: 'CA', name: 'Canada' }],
    },
  ],
  shippingMethods: [
    {
      name: 'Standard Shipping',
      price: 1000, // $10.00 in cents
      description: 'Standard shipping within 5-7 business days',
    },
    {
      name: 'Express Shipping',
      price: 2500, // $25.00 in cents
      description: 'Express shipping within 2-3 business days',
    },
  ],
  paymentMethods: [
    {
      name: 'Standard Payment',
      handler: {
        code: 'standard-payment-handler',
        arguments: [],
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
  initialData: {
    adminEmailAddress: process.env.SUPERADMIN_EMAIL || 'admin@hunterirrigationsupply.com',
    adminPassword: process.env.SUPERADMIN_PASSWORD || 'superadmin',
  },
};

