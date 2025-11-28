import { VendureConfig } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { EmailPlugin } from '@vendure/email-plugin';
// JobQueuePlugin is built into Vendure core, no need to import
// S3 plugin removed - use AssetServerPlugin with local storage or configure separately
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

export const config: VendureConfig = {
  apiOptions: {
    port: 3000,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    cors: {
      origin: isDev
        ? ['http://localhost:3000', 'http://localhost:3001']
        : [
            'https://hunterirrigationsupply.com',
            'https://www.hunterirrigationsupply.com',
            'https://hunterirrigation.ca',
            'https://www.hunterirrigation.ca',
          ],
      credentials: true,
    },
  },
  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    cookieOptions: {
      secret: process.env.COOKIE_SECRET || 'changeme-secret-key',
    },
  },
  dbConnectionOptions: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'vendure',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'vendure',
    synchronize: process.env.DB_SYNC === 'true', // Auto-create schema on first run
    logging: isDev,
    migrations: [path.join(__dirname, '../migrations/*.ts')],
  },
  paymentOptions: {
    paymentMethodHandlers: [],
  },
  customFields: {},
  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../static/assets'),
    }),
    AdminUiPlugin.init({
      route: 'admin',
      port: 3000,
    }),
    EmailPlugin.init({
      handlers: [],
      transport: {
        type: 'smtp',
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
      templatePath: path.join(__dirname, '../static/email/templates'),
      globalTemplateVars: {
        fromAddress: process.env.EMAIL_FROM || 'noreply@hunterirrigationsupply.com',
        fromName: 'Hunter Irrigation',
      },
    }),
    // Job queue is configured via dbConnectionOptions
    // Redis can be added later if needed
  ],
};

