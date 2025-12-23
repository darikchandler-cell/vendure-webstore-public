/**
 * Quick script to trigger import via direct execution
 * This can be called from the server
 */

import 'reflect-metadata';
import { importProducts } from './woocommerce-import/index';

// Run import with 5 products as test
importProducts({
  limit: 5,
  dryRun: false,
  skipImages: false,
}).then(() => {
  console.log('✅ Import completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});

