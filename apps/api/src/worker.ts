import 'reflect-metadata';
import { bootstrapWorker } from '@vendure/core';
import { config } from './vendure-config';

let worker: any;

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  
  if (worker) {
    try {
      // Give running jobs time to complete (60 seconds for worker)
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Close the worker
      if (typeof worker.close === 'function') {
        await worker.close();
      }
      
      console.log('✅ Worker graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during worker shutdown:', err);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception in worker:', err);
  shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection in worker at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

bootstrapWorker(config)
  .then((vendureWorker) => {
    worker = vendureWorker;
    console.log('✅ Vendure worker started');
  })
  .catch((err) => {
    console.error('❌ Error starting Vendure worker:', err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  });

