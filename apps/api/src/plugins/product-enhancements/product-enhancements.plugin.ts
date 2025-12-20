import { VendurePlugin } from '@vendure/core';
import { Brand } from './entities/brand.entity';
import { BrandService } from './brand.service';
import { BrandResolver } from './brand.resolver';
import { gql } from 'apollo-server-express';
import { readFileSync } from 'fs';
import path from 'path';

const schema = gql(readFileSync(path.join(__dirname, 'product-enhancements.graphql'), 'utf-8'));

/**
 * Product Enhancements Plugin for Vendure
 * 
 * Adds:
 * - Brand entity and management
 * - Custom fields for Product (brand, shortDescription, metaTitle, metaDescription, keywords)
 * - Custom fields for ProductVariant (weight, dimensions, customStockStatus, upc)
 */
@VendurePlugin({
  imports: [],
  entities: [Brand],
  providers: [BrandService],
  adminApiExtensions: {
    resolvers: [BrandResolver],
    schema: () => schema,
  },
  shopApiExtensions: {
    resolvers: [BrandResolver],
    schema: () => schema,
  },
  compatibility: '^2.0.0',
  configuration: (config) => {
    return config;
  },
})
export class ProductEnhancementsPlugin {}

