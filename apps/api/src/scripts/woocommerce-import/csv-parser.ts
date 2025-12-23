/**
 * CSV Parser
 * Parses WooCommerce CSV export file
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { WooCommerceProduct } from './types';

/**
 * Parse CSV file and return array of products
 */
export function parseCSV(filePath: string): WooCommerceProduct[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as WooCommerceProduct[];

  return records;
}

/**
 * Validate CSV structure
 * Returns warnings for missing prices but doesn't fail validation
 */
export function validateCSV(products: WooCommerceProduct[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (products.length === 0) {
    errors.push('CSV file is empty or contains no valid products');
    return { valid: false, errors };
  }

  // Check required fields (SKU and Name are required, price is optional - will be filtered)
  const requiredFields = ['SKU', 'Name'];
  products.forEach((product, index) => {
    requiredFields.forEach(field => {
      if (!product[field] || product[field].trim() === '') {
        errors.push(`Row ${index + 2}: Missing required field "${field}"`);
      }
    });
    
    // Warn about missing prices but don't fail
    if (!product['Regular price'] || product['Regular price'].trim() === '') {
      // Just log a warning, don't add to errors
      console.warn(`Row ${index + 2}: Missing "Regular price" - product will be skipped`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filter products (e.g., only published products)
 */
export function filterProducts(
  products: WooCommerceProduct[],
  options: {
    publishedOnly?: boolean;
    featuredOnly?: boolean;
  } = {}
): WooCommerceProduct[] {
  let filtered = products;

  if (options.publishedOnly) {
    filtered = filtered.filter(p => p.Published === '1');
  }

  if (options.featuredOnly) {
    filtered = filtered.filter(p => p['Is featured?'] === '1');
  }

  return filtered;
}

