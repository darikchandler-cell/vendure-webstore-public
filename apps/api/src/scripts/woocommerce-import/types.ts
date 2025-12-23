/**
 * Type definitions for WooCommerce CSV import
 */

export interface WooCommerceProduct {
  ID: string;
  Type: string;
  SKU: string;
  'GTIN, UPC, EAN, or ISBN': string;
  Name: string;
  Published: string;
  'Is featured?': string;
  'Visibility in catalog': string;
  'Short description': string;
  Description: string;
  'Date sale price starts': string;
  'Date sale price ends': string;
  'Tax status': string;
  'Tax class': string;
  'In stock?': string;
  Stock: string;
  'Low stock amount': string;
  'Backorders allowed?': string;
  'Sold individually?': string;
  'Weight (lbs)': string;
  'Length (in)': string;
  'Width (in)': string;
  'Height (in)': string;
  'Allow customer reviews?': string;
  'Purchase note': string;
  'Sale price': string;
  'Regular price': string;
  Categories: string;
  Tags: string;
  'Shipping class': string;
  Images: string;
  'Download limit': string;
  'Download expiry days': string;
  Parent: string;
  'Grouped products': string;
  Upsells: string;
  'Cross-sells': string;
  'External URL': string;
  'Button text': string;
  Position: string;
  'Cost of goods': string;
  Brands: string;
  'Attribute 1 name': string;
  'Attribute 1 value(s)': string;
  'Attribute 1 visible': string;
  'Attribute 1 global': string;
  [key: string]: string; // For any additional meta fields
}

export interface ProductTranslation {
  languageCode: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
}

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
  useCase?: string[];
  applicationCategory?: string;
  audience?: string;
  compatibility?: string[];
  manufacturerUrl?: string;
}

