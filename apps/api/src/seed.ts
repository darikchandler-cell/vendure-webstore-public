import 'reflect-metadata';
import { bootstrap, JobQueueService, RequestContext } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import { config } from './vendure-config';
import { initialData } from './initial-data';

const populateData = async () => {
  // Override port to avoid conflict with running server
  // And remove plugins that might start servers (AdminUI, AssetServer)
  const scriptConfig = {
    ...config,
    apiOptions: {
      ...config.apiOptions,
      port: 3004, // Use a different port than create-channels
    },
    plugins: config.plugins?.filter(p => 
      !p.constructor.name.includes('AdminUiPlugin') && 
      !p.constructor.name.includes('AssetServerPlugin')
    ) || [],
  };

  const app: any = await bootstrap(scriptConfig);
  await populate(
    () => app,
    initialData
  );
  console.log('Data populated successfully');
  process.exit(0);
};

populateData();

