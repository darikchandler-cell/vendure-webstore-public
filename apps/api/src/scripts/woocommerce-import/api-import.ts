/**
 * API-Based WooCommerce Import
 * Uses Vendure Admin API to import products programmatically
 */

import 'reflect-metadata';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { parseCSV, validateCSV, filterProducts } from './csv-parser';
import { transformProduct } from './product-transformer';
import { processImages, generateBrandSlug } from './utils/asset-handler';
import { WooCommerceProduct, ImportedProduct } from './types';
import { LanguageCode } from '@vendure/core';

interface ImportOptions {
  apiUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
  limit?: number;
  skipImages?: boolean;
  csvPath?: string;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

class VendureAPIClient {
  private apiUrl: string;
  private authToken: string | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
  }

  async login(username: string, password: string): Promise<string> {
    const mutation = `
      mutation {
        login(username: "${username}", password: "${password}") {
          ... on CurrentUser {
            id
            identifier
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `;

    const response = await this.query(mutation);
    
    if (response.errors) {
      throw new Error(`Login failed: ${response.errors[0].message}`);
    }

    // Get token from Set-Cookie header or response
    // For now, we'll use cookie-based auth
    this.authToken = 'authenticated'; // Placeholder
    return this.authToken;
  }

  async query(query: string, variables?: any): Promise<GraphQLResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.apiUrl}/admin-api`);
      const postData = JSON.stringify({ query, variables });

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...(this.authToken ? { 'Cookie': `vendure-token=${this.authToken}` } : {}),
        },
      };

      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async createProduct(productData: any): Promise<any> {
    const mutation = `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          id
          name
          slug
        }
      }
    `;

    const response = await this.query(mutation, { input: productData });
    
    if (response.errors) {
      throw new Error(`Create product failed: ${response.errors[0].message}`);
    }

    return response.data?.createProduct;
  }
}

async function importViaAPI(options: ImportOptions = {}) {
  const {
    apiUrl = process.env.VENDURE_API_URL || 'https://hunterirrigationsupply.com',
    adminUsername = process.env.ADMIN_USERNAME || 'superadmin',
    adminPassword = process.env.ADMIN_PASSWORD || '',
    limit,
    skipImages = false,
    csvPath = path.join(process.cwd(), 'import-hunter.csv'),
  } = options;

  console.log('🚀 Starting API-based WooCommerce import...');
  console.log(`📡 API URL: ${apiUrl}`);
  console.log(`📁 CSV Path: ${csvPath}`);

  // Initialize API client
  const client = new VendureAPIClient(apiUrl);

  // Login
  console.log('\n🔐 Logging in to Vendure Admin API...');
  try {
    await client.login(adminUsername, adminPassword);
    console.log('✅ Login successful');
  } catch (error) {
    console.error('❌ Login failed:', error);
    process.exit(1);
  }

  // Parse CSV
  console.log('\n📖 Parsing CSV file...');
  let wcProducts: WooCommerceProduct[];
  try {
    wcProducts = parseCSV(csvPath);
    console.log(`✅ Parsed ${wcProducts.length} products from CSV`);
  } catch (error) {
    console.error('❌ Error parsing CSV:', error);
    process.exit(1);
  }

  // Validate and filter
  const { valid: rawValidProducts, invalid: rawInvalidProducts } = validateCSV(wcProducts);
  console.log(`ℹ️  ${rawValidProducts.length} valid products, ${rawInvalidProducts.length} invalid products`);

  const validProducts = filterProducts(rawValidProducts, limit);
  console.log(`📦 Processing ${validProducts.length} products\n`);

  // Process products
  let successCount = 0;
  let errorCount = 0;

  for (const wcProduct of validProducts) {
    try {
      console.log(`Processing: ${wcProduct.Name} (SKU: ${wcProduct.SKU})`);

      // Transform product
      const importedProduct = transformProduct(wcProduct, [LanguageCode.en]);

      // Create product via API
      const productInput = {
        translations: importedProduct.translations.map(t => ({
          languageCode: t.languageCode,
          name: t.name,
          slug: t.slug,
          description: t.description,
          shortDescription: t.shortDescription,
        })),
        customFields: {
          metaTitle: importedProduct.translations[0]?.metaTitle,
          metaDescription: importedProduct.translations[0]?.metaDescription,
        },
      };

      const product = await client.createProduct(productInput);
      console.log(`  ✅ Created: ${product.name}`);
      successCount++;

    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      errorCount++;
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Total processed: ${validProducts.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: ImportOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit=') {
      options.limit = parseInt(args[i].split('=')[1], 10);
    } else if (args[i] === '--skip-images') {
      options.skipImages = true;
    } else if (args[i].startsWith('--api-url=')) {
      options.apiUrl = args[i].split('=')[1];
    } else if (args[i].startsWith('--csv-path=')) {
      options.csvPath = args[i].split('=')[1];
    }
  }

  importViaAPI(options).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { importViaAPI };


