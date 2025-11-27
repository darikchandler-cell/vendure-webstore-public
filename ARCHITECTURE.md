# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└───────────────────────┬─────────────────────────────────────┘
                       │
                       │ HTTPS (80/443)
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                    Caddy Reverse Proxy                       │
│  - hunterirrigationsupply.com (US)                          │
│  - hunterirrigation.ca (CA)                                 │
│  - Auto SSL/TLS (Let's Encrypt)                             │
└──────────────┬──────────────────────┬──────────────────────┘
               │                        │
    ┌──────────▼──────────┐   ┌────────▼──────────┐
    │  Next.js Storefront  │   │  Vendure API      │
    │  (Port 3000)         │   │  (Port 3000)      │
    │                      │   │  - Admin UI       │
    │  - SSR/SSG           │   │  - Shop API       │
    │  - Channel Detection │   │  - GraphQL        │
    │  - SEO Optimized     │   │  - REST           │
    └──────────────────────┘   └────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
         ┌──────────▼─────────┐  ┌───────▼──────┐  ┌─────────▼────────┐
         │   PostgreSQL 15     │  │   Redis 7    │  │  Vendure Worker   │
         │   (Port 5432)       │  │  (Port 6379)  │  │  (Background Jobs)│
         │                     │  │              │  │                   │
         │  - Products         │  │  - Cache     │  │  - Email Queue    │
         │  - Orders           │  │  - Job Queue │  │  - Search Index   │
         │  - Customers        │  │              │  │  - Reports        │
         └─────────────────────┘  └──────────────┘  └───────────────────┘
```

## Technology Stack

### Backend
- **Vendure 2.2.0** - Headless commerce framework
- **Node.js 20** - Runtime
- **TypeScript 5.3** - Type safety
- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching and job queue
- **TypeORM** - ORM for database operations

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript 5.3** - Type safety
- **TailwindCSS 3.4** - Styling
- **Apollo Client 3.8** - GraphQL client
- **React 18** - UI library

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Caddy 2** - Reverse proxy with auto HTTPS
- **Ubuntu 22.04** - Server OS

## Multi-Channel Architecture

### Channel Configuration

| Channel | Domain | Currency | Code | Token |
|---------|--------|----------|------|-------|
| US | hunterirrigationsupply.com | USD | `us` | `us-channel-token` |
| CA | hunterirrigation.ca | CAD | `ca` | `ca-channel-token` |

### Channel Detection Flow

```
1. Request arrives at Caddy
   ↓
2. Caddy forwards to Next.js with Host header
   ↓
3. Next.js detects channel from Host header
   ↓
4. Apollo Client adds channel token to GraphQL requests
   ↓
5. Vendure API validates token and returns channel-specific data
```

### Data Sharing

- **Shared**: Products, variants, categories, assets
- **Channel-Specific**: Prices, tax rates, shipping zones, currency

## Project Structure

```
hunter-irrigation-ecommerce/
├── apps/
│   ├── api/                    # Vendure backend
│   │   ├── src/
│   │   │   ├── index.ts        # API server entry
│   │   │   ├── worker.ts       # Background worker entry
│   │   │   ├── vendure-config.ts  # Vendure configuration
│   │   │   ├── create-channels.ts  # Channel creation script
│   │   │   ├── seed-products.ts    # Product seeding script
│   │   │   └── initial-data.ts     # Initial data configuration
│   │   ├── migrations/         # Database migrations
│   │   ├── static/            # Static assets (if not using S3)
│   │   ├── Dockerfile          # API container
│   │   └── Dockerfile.worker  # Worker container
│   │
│   └── storefront/             # Next.js frontend
│       ├── app/                # App Router pages
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Home page
│       │   ├── products/       # Products listing
│       │   ├── product/[slug]/ # Product detail pages
│       │   ├── sitemap.ts      # Dynamic sitemap
│       │   └── robots.ts       # Robots.txt
│       ├── lib/
│       │   ├── channel.ts      # Channel detection logic
│       │   ├── apollo-client.ts # GraphQL client setup
│       │   └── graphql/
│       │       └── queries.ts  # GraphQL queries
│       └── Dockerfile          # Storefront container
│
├── infra/
│   ├── caddy/
│   │   └── Caddyfile           # Reverse proxy config
│   ├── deploy.sh               # Deployment script
│   └── README.md               # Infrastructure docs
│
├── docker-compose.yml          # Service orchestration
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # pnpm workspace config
├── README.md                   # Main documentation
└── DEPLOYMENT.md               # Deployment guide
```

## Data Flow

### Product Listing Flow

```
User → Caddy → Next.js (SSR)
                ↓
         Detect Channel (from Host)
                ↓
         Apollo Client (with channel token)
                ↓
         Vendure Shop API
                ↓
         PostgreSQL (channel-specific prices)
                ↓
         Return products with correct currency
                ↓
         Render HTML with SEO metadata
```

### Product Detail Flow

```
User → /product/[slug]
                ↓
         Next.js generates page (SSG/SSR)
                ↓
         Fetch product data with channel token
                ↓
         Render with:
           - Channel-specific price
           - Correct currency formatting
           - SEO metadata (title, description, OG tags)
           - JSON-LD structured data
```

## SEO Features

### Implemented

- ✅ Dynamic meta tags per page
- ✅ OpenGraph tags for social sharing
- ✅ Twitter Card metadata
- ✅ Canonical URLs
- ✅ XML Sitemap generation
- ✅ Robots.txt configuration
- ✅ JSON-LD structured data (Product schema)
- ✅ Server-side rendering (SSR)
- ✅ Image optimization (Next.js Image component)

### URL Structure

- Home: `/`
- Products: `/products`
- Product: `/product/[slug]`
- Category: `/category/[slug]` (future)

## Security

- Environment variables for secrets
- CORS configuration per domain
- Channel token validation
- Cookie-based authentication
- HTTPS enforced (via Caddy)
- Database connection security
- Input sanitization (Vendure handles)

## Performance

- Redis caching for API responses
- Next.js image optimization
- Gzip/Brotli compression (Caddy)
- Static asset caching
- Database connection pooling
- Job queue for async operations

## Scalability

### Current (Single Server)

All services run on one server with Docker Compose.

### Future (Multi-Node)

1. External PostgreSQL database
2. Shared Redis instance
3. Multiple Next.js instances
4. Load balancer (Hetzner LB or Caddy)
5. CDN for static assets (S3 + CloudFront)

## Environment Variables

### Root (.env)
- Database credentials
- Redis configuration
- S3 storage (optional)
- Domain names

### Vendure API (apps/api/.env)
- Database connection
- Channel tokens
- Cookie secret
- S3 credentials (if using)
- SMTP settings

### Storefront (apps/storefront/.env)
- Vendure API URL
- Channel tokens (public)

## Deployment

See `DEPLOYMENT.md` for complete deployment instructions.

Quick steps:
1. Clone repository
2. Run `infra/deploy.sh`
3. Configure environment variables
4. Point DNS to server
5. Caddy auto-provisions SSL

## Development

```bash
# Install dependencies
pnpm install

# Start all services
pnpm docker:up

# Run migrations
cd apps/api && pnpm run migration:run

# Create channels
ts-node -r tsconfig-paths/register src/create-channels.ts

# Seed data
pnpm run seed

# Development mode
pnpm dev
```

## Monitoring

- Docker logs: `docker compose logs -f`
- Service health: `docker compose ps`
- Database: PostgreSQL logs
- Application: Vendure admin UI

## Backup Strategy

- Database: `pg_dump` scheduled backups
- Assets: S3 versioning (if using S3)
- Configuration: Git repository

