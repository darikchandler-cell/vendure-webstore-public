import 'reflect-metadata';
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';

bootstrap(config)
  .then((app) => {
    console.log(`Vendure server running on http://localhost:${config.apiOptions.port}`);
  })
  .catch((err) => {
    console.error('Error starting Vendure server:', err);
    process.exit(1);
  });

