import 'reflect-metadata';
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';
import { runMigrations } from '@vendure/core';

const command = process.argv[2];

async function migrate() {
  const app = await bootstrap(config);

  try {
    switch (command) {
      case 'create':
        console.log('To create a migration, use:');
        console.log('  typeorm migration:create -n MigrationName');
        break;
      case 'run':
        await runMigrations(app);
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

