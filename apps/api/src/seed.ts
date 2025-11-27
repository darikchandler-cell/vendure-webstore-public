import 'reflect-metadata';
import { bootstrap, JobQueueService, RequestContext } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import { config } from './vendure-config';
import { initialData } from './initial-data';

const populateData = async () => {
  const app = await bootstrap(config);
  await populate(
    () => app,
    initialData,
    (err) => {
      console.error('Error populating data:', err);
      process.exit(1);
    }
  );
  console.log('Data populated successfully');
  process.exit(0);
};

populateData();

