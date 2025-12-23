import { VendureConfig, dummyPaymentHandler, LanguageCode } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { EmailPlugin } from '@vendure/email-plugin';
// JobQueuePlugin is built into Vendure core, no need to import
// S3 plugin removed - use AssetServerPlugin with local storage or configure separately
import path from 'path';
import { TotpMfaPlugin } from './plugins/totp-mfa/totp-mfa.plugin';
import { ProductEnhancementsPlugin } from './plugins/product-enhancements/product-enhancements.plugin';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Environment variable validation
function validateEnv() {
  const required = [
    'DB_HOST',
    'DB_NAME',
    'DB_USERNAME',
    'DB_PASSWORD',
    'COOKIE_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && !isDev) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Please set these variables before starting in production mode.');
    process.exit(1);
  }
  
  // Warn about default values in production
  if (!isDev) {
    if (process.env.COOKIE_SECRET === 'changeme-secret-key') {
      console.warn('⚠️  WARNING: Using default COOKIE_SECRET. This is insecure in production!');
    }
    if (process.env.DB_PASSWORD === 'changeme') {
      console.warn('⚠️  WARNING: Using default database password. This is insecure in production!');
    }
  }
}

validateEnv();

export const config: VendureConfig = {
  apiOptions: {
    port: 3000,
    hostname: isDev ? 'localhost' : '0.0.0.0', // Listen on all interfaces in production
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    cors: {
      origin: isDev
        ? ['http://localhost:3000', 'http://localhost:3001']
        : process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
          : [
              'https://hunterirrigationsupply.com',
              'https://www.hunterirrigationsupply.com',
              'https://hunterirrigation.ca',
              'https://www.hunterirrigation.ca',
            ],
      credentials: true,
    },
    middleware: [{
      handler: (req: any, res: any, next: any) => {
        // Trust proxy for secure cookies behind Caddy
        if (req.app && typeof req.app.set === 'function') {
          req.app.set('trust proxy', 1);
        }
        next();
      },
      route: 'admin-api',
    }, {
      handler: (req: any, res: any, next: any) => {
        if (req.app && typeof req.app.set === 'function') {
          req.app.set('trust proxy', 1);
        }
        next();
      },
      route: 'shop-api',
    }],
  },
  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    cookieOptions: {
      secret: process.env.COOKIE_SECRET || 'changeme-secret-key',
      secure: !isDev,
      sameSite: 'lax',
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
    // Connection pooling configuration for production performance
    extra: {
      max: 20, // Maximum number of connections in the pool
      min: 5,  // Minimum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
      // Enable SSL in production if connecting to external database
      ...(process.env.DB_SSL === 'true' ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      } : {}),
    },
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },
  customFields: {
    Administrator: [
      {
        name: 'totpSecret',
        type: 'string',
        nullable: true,
        public: false,
        readonly: false,
      },
    ],
    Product: [
      {
        name: 'brandId',
        type: 'string',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Brand ID' }],
        description: [{ languageCode: LanguageCode.en, value: 'The ID of the brand associated with this product' }],
      },
      {
        name: 'shortDescription',
        type: 'text',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Short Description' }],
        description: [{ languageCode: LanguageCode.en, value: 'Brief description for product listings and previews' }],
      },
      {
        name: 'metaTitle',
        type: 'string',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Meta Title' }],
        description: [{ languageCode: LanguageCode.en, value: 'SEO meta title (overrides default if set)' }],
      },
      {
        name: 'metaDescription',
        type: 'text',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Meta Description' }],
        description: [{ languageCode: LanguageCode.en, value: 'SEO meta description' }],
      },
      {
        name: 'keywords',
        type: 'string',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Keywords' }],
        description: [{ languageCode: LanguageCode.en, value: 'Comma-separated keywords for SEO' }],
      },
    ],
    ProductVariant: [
      {
        name: 'weight',
        type: 'int',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Weight (grams)' }],
        description: [{ languageCode: LanguageCode.en, value: 'Product weight in grams' }],
      },
      {
        name: 'length',
        type: 'int',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Length (mm)' }],
        description: [{ languageCode: LanguageCode.en, value: 'Product length in millimeters' }],
      },
      {
        name: 'width',
        type: 'int',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Width (mm)' }],
        description: [{ languageCode: LanguageCode.en, value: 'Product width in millimeters' }],
      },
      {
        name: 'height',
        type: 'int',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Height (mm)' }],
        description: [{ languageCode: LanguageCode.en, value: 'Product height in millimeters' }],
      },
      {
        name: 'customStockStatus',
        type: 'string',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'Custom Stock Status' }],
        description: [{ languageCode: LanguageCode.en, value: 'Custom stock status (e.g., in-stock, out-of-stock, backorder, pre-order)' }],
      },
      {
        name: 'upc',
        type: 'string',
        nullable: true,
        public: true,
        readonly: false,
        label: [{ languageCode: LanguageCode.en, value: 'UPC' }],
        description: [{ languageCode: LanguageCode.en, value: 'Universal Product Code' }],
      },
    ],
  },
  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(__dirname, '../static/assets'),
    }),
    AdminUiPlugin.init({
      route: 'admin',
      port: 3000,
      // Configure for production to prevent vendure.io asset requests
      ...(isDev
        ? {}
        : {
            // In production, ensure Admin UI uses the correct domain
            // This prevents requests to vendure.io domains
            baseHref: '/admin',
          }),
      // Admin UI Extensions
      // Note: For Vendure 2.3.3, extensions are typically compiled separately
      // and included via the Admin UI build process. The extension structure
      // is created but may need manual integration with the Admin UI build.
      // See: apps/admin-ui-extensions/*/README.md
      // Extensions configuration removed - not supported in this Vendure version
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
        // fromAddress will be set per-channel in email templates using getFromAddressForChannel()
        // For now, using a default that will be overridden by channel-specific logic
        fromAddress: 'orders@hunterirrigationsupply.com', // Default, will be channel-specific in practice
        fromName: process.env.EMAIL_FROM_NAME || 'Hunter Irrigation Supply',
      },
    }),
    TotpMfaPlugin,
    ProductEnhancementsPlugin,
    // Job queue configuration
    // Currently using database-based job queue (built into Vendure core)
    // For better performance at scale, consider using Redis job queue:
    // 1. Install: npm install @vendure/redis-job-queue-plugin
    // 2. Import: import { RedisJobQueuePlugin } from '@vendure/redis-job-queue-plugin';
    // 3. Add to plugins array:
    //    RedisJobQueuePlugin.init({
    //      connection: {
    //        host: process.env.REDIS_HOST || 'localhost',
    //        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    //      },
    //    }),
    // Note: Redis is already running in docker-compose.yml, just needs plugin configuration
  ],
};

