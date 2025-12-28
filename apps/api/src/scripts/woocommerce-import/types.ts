/**
 * Type definitions for WooCommerce import
 */

/**
 * WooCommerce CSV product structure
 */
export interface WooCommerceProduct {
  SKU: string;
  Name: string;
  Description?: string;
  'Short description'?: string;
  Categories?: string;
  'Product Type'?: string;
  Price?: string;
  'Regular price'?: string;
  'Sale price'?: string;
  Stock?: string;
  'Stock status'?: string;
  Images?: string;
  Brand?: string;
  Brands?: string;
  'Part Number'?: string;
  UPC?: string;
  'GTIN, UPC, EAN, or ISBN'?: string;
  Weight?: string;
  'Weight (lbs)'?: string;
  Length?: string;
  'Length (in)'?: string;
  Width?: string;
  'Width (in)'?: string;
  Height?: string;
  'Height (in)'?: string;
  Tags?: string;
  'In stock?'?: string;
  [key: string]: string | undefined;
}

/**
 * Transformed product ready for Vendure import
 */
export interface ImportedProduct {
  sku: string;
  upc?: string;
  brand?: string;
  translations: ProductTranslation[];
  regularPrice: number;
  salePrice?: number;
  categories: string[];
  tags: string[];
  images: string[];
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  stock?: number;
  inStock: boolean;
  description?: string;
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  useCases?: string[];
  compatibility?: string[];
  applicationCategory?: string;
  audience?: string;
  manufacturerUrl?: string;
  customFields?: Record<string, any>;
}

/**
 * Product translation data
 */
export interface ProductTranslation {
  languageCode: string;
  name: string;
  description?: string;
  shortDescription?: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  customFields?: Record<string, any>;
}

