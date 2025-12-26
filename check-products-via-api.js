#!/usr/bin/env node
/**
 * Check Product Count via Vendure GraphQL API
 * Queries the public shop API to get actual product count
 */

const https = require('https');
const http = require('http');

const API_URL = process.env.VENDURE_API_URL || 'https://hunterirrigationsupply.com/shop-api';
const US_CHANNEL_TOKEN = process.env.US_CHANNEL_TOKEN || 'e8feb84eb1c9a971babd442996f62ed2';
const EXPECTED_COUNT = 861;

const query = `
  query GetProductCount($options: ProductListOptions) {
    products(options: $options) {
      totalItems
    }
  }
`;

async function checkProductCount() {
  console.log('🔍 Checking Product Count via Vendure API');
  console.log('==========================================');
  console.log('');
  console.log(`API URL: ${API_URL}`);
  console.log('');

  const requestBody = JSON.stringify({
    query,
    variables: {
      options: {
        take: 1, // We only need the count, not the items
      },
    },
  });

  const url = new URL(API_URL);
  const client = url.protocol === 'https:' ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'vendure-token': US_CHANNEL_TOKEN,
    },
  };

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.errors) {
            console.error('❌ GraphQL Errors:');
            result.errors.forEach((error) => {
              console.error(`   ${error.message}`);
            });
            reject(new Error('GraphQL query failed'));
            return;
          }

          const totalItems = result.data?.products?.totalItems || 0;
          
          console.log('📊 Product Count Results:');
          console.log('--------------------------');
          console.log(`  Products in Store:  ${totalItems}`);
          console.log(`  Expected Products:  ${EXPECTED_COUNT}`);
          console.log('');

          if (totalItems >= EXPECTED_COUNT) {
            console.log('✅ SUCCESS: All products are deployed!');
            console.log(`   Found ${totalItems} products (expected ${EXPECTED_COUNT})`);
            if (totalItems > EXPECTED_COUNT) {
              console.log(`   Note: ${totalItems - EXPECTED_COUNT} extra products found`);
            }
          } else if (totalItems > 0) {
            const diff = EXPECTED_COUNT - totalItems;
            const percent = Math.round((totalItems / EXPECTED_COUNT) * 100);
            console.log(`⚠️  PARTIAL: Only ${totalItems} of ${EXPECTED_COUNT} products deployed (${percent}%)`);
            console.log(`   Missing: ${diff} products`);
            console.log('');
            console.log('💡 Possible reasons:');
            console.log('   - Import may still be in progress');
            console.log('   - Some products may have failed to import');
            console.log('   - Products may not be assigned to the US channel');
          } else {
            console.log('❌ ERROR: No products found in store!');
            console.log('');
            console.log('💡 Possible reasons:');
            console.log('   - Import has not been run');
            console.log('   - Import failed');
            console.log('   - Products not assigned to channels');
            console.log('   - API endpoint or channel token incorrect');
          }

          console.log('');
          console.log('💡 To verify manually:');
          console.log('   Admin: https://hunterirrigationsupply.com/admin');
          console.log('   Store: https://hunterirrigationsupply.com');
          console.log('');

          resolve(totalItems);
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.error('Response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      console.error('');
      console.error('💡 Check:');
      console.error('   - API URL is correct');
      console.error('   - Server is running');
      console.error('   - Network connectivity');
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

// Run the check
checkProductCount()
  .then((count) => {
    process.exit(count >= EXPECTED_COUNT ? 0 : 1);
  })
  .catch((error) => {
    console.error('Failed to check product count:', error.message);
    process.exit(1);
  });

