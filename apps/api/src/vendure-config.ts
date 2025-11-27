import { VendureConfig } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { EmailPlugin } from '@vendure/email-plugin';
import { JobQueuePlugin } from '@vendure/job-queue-plugin';
import { S3AssetStoragePlugin } from '@vendure/s3-asset-storage-plugin';
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
    synchronize: false, // Always use migrations in production
    logging: isDev,
    migrations: [path.join(__dirname, '../migrations/*.ts')],
  },
  paymentOptions: {
    paymentMethodHandlers: [],
  },
  customFields: {},
  plugins: [
    // S3 Asset Storage (if configured) or default Asset Server
    ...(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID
      ? [
          S3AssetStoragePlugin.init({
            bucket: process.env.S3_BUCKET || '',
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            },
            region: process.env.S3_REGION || 'us-east-1',
            endpoint: process.env.S3_ENDPOINT,
          }),
        ]
      : [
          AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            port: 3000,
          }),
        ]),
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
    JobQueuePlugin.init({
      pollInterval: 200,
      ...(process.env.REDIS_HOST
        ? {
            queueOptions: {
              connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
              },
            },
          }
        : {}),
    }),
  ],
};

