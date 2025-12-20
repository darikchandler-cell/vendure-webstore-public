import 'reflect-metadata';
import { runMigrations } from '@vendure/core';
import { config } from './vendure-config';

const command = process.argv[2];

async function migrate() {
  try {
    switch (command) {
      case 'create':
        console.log('To create a migration, use:');
        console.log('  typeorm migration:create -n MigrationName');
        break;
      case 'run':
        // Pass config, not app instance
        await runMigrations(config);
        console.log('✅ Migrations completed');
        break;
      case 'revert':
        console.log('Revert functionality not implemented. Use database rollback tools.');
        break;
      default:
        console.log('Usage: npm run migration:[create|run|revert]');
    }
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();

