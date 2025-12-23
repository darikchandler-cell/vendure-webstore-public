import 'reflect-metadata';
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';

let app: any;

// Graceful shutdown handler
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  
  if (app) {
    try {
      // Give existing requests time to complete (30 seconds)
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Close the app
      if (typeof app.close === 'function') {
        await app.close();
      }
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
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
  console.error('❌ Uncaught Exception:', err);
  shutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
});

bootstrap(config)
  .then((vendureApp) => {
    app = vendureApp;
    
    // Enable trust proxy for secure cookies behind Caddy
    try {
      // @ts-ignore
      const expressApp = vendureApp.getHttpAdapter().getInstance();
      if (expressApp && typeof expressApp.set === 'function') {
        expressApp.set('trust proxy', 1);
        console.log('✅ Enabled "trust proxy" for secure cookies');
      }
      
      // Register import endpoint
      if (expressApp && typeof expressApp.post === 'function') {
        const { handleImportRequest } = require('./scripts/woocommerce-import/import-endpoint');
        expressApp.post('/api/import', handleImportRequest);
        console.log('✅ Registered import endpoint: POST /api/import');
      }
    } catch (e) {
      console.log('⚠️ Could not set "trust proxy":', e);
    }

    console.log(`✅ Vendure server running on http://${config.apiOptions.hostname}:${config.apiOptions.port}`);
    console.log(`   Admin API: http://${config.apiOptions.hostname}:${config.apiOptions.port}/${config.apiOptions.adminApiPath}`);
    console.log(`   Shop API: http://${config.apiOptions.hostname}:${config.apiOptions.port}/${config.apiOptions.shopApiPath}`);
    
    // Add health check endpoint - DISABLED as it causes crash and we have a HealthController
    // @ts-ignore
    /*
    const expressApp = vendureApp.getHttpServer ? vendureApp.getHttpServer() : vendureApp.httpServer;
    if (expressApp && typeof expressApp.get === 'function') {
      expressApp.get('/health', (req: any, res: any) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
      });
    }
    */
  })
  .catch((err) => {
    console.error('❌ Error starting Vendure server:', err);
    console.error('Stack trace:', err.stack);
    
    // Provide helpful error messages for common issues
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('connect')) {
      console.error('');
      console.error('💡 Database connection error detected!');
      console.error('   Check:');
      console.error('   1. Database container is running: docker compose ps postgres');
      console.error('   2. DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD environment variables');
      console.error('   3. Database is accessible: docker compose exec postgres pg_isready');
    }
    
    if (err.message?.includes('password') || err.message?.includes('authentication')) {
      console.error('');
      console.error('💡 Database authentication error detected!');
      console.error('   Check DB_USERNAME and DB_PASSWORD environment variables');
    }
    
    process.exit(1);
  });

