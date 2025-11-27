# Hunter Irrigation Ecommerce Platform

Headless ecommerce platform built with Vendure (backend) and Next.js (storefront), supporting multi-region operations for US and Canada.

## Architecture

- **Backend**: Vendure headless commerce (Node.js + TypeScript)
- **Frontend**: Next.js 14 with App Router, TypeScript, TailwindCSS
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Reverse Proxy**: Caddy
- **Containerization**: Docker + docker-compose

## Project Structure

```
.
├── apps/
│   ├── api/              # Vendure backend server
│   └── storefront/       # Next.js storefront
├── infra/                # Docker, proxy configs, deployment scripts
├── docker-compose.yml    # Development and production orchestration
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 8+
- Docker and Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

### Development Setup

1. **Clone and install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

Copy the example env files and configure:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/storefront/.env.example apps/storefront/.env
cp .env.example .env
```

3. **Start services with Docker:**

```bash
pnpm docker:up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Vendure API (port 3000)
- Vendure Worker
- Next.js Storefront (port 3001)
- Caddy reverse proxy (port 80, 443)

4. **Run migrations and seed data:**

```bash
cd apps/api
pnpm run migration:run
pnpm run seed
```

5. **Access the applications:**

- Storefront: http://localhost (configured for localhost)
- Vendure Admin: http://localhost/admin
- Shop API: http://localhost/shop-api

### Development Commands

```bash
# Run all services in dev mode
pnpm dev

# Build all apps
pnpm build

# Start production builds
pnpm start

# Lint all apps
pnpm lint

# Docker commands
pnpm docker:up      # Start all services
pnpm docker:down    # Stop all services
pnpm docker:logs    # View logs
pnpm docker:build   # Rebuild images
```

## Multi-Channel Configuration

The platform supports two channels:

- **US Channel** (`us`): `hunterirrigationsupply.com` - USD currency
- **CA Channel** (`ca`): `hunterirrigation.ca` - CAD currency

Products and variants are shared across channels, but prices are channel-specific.

## Production Deployment

### On Ubuntu 22.04 Server

1. **Install prerequisites:**

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git nodejs pnpm
sudo systemctl enable docker
sudo systemctl start docker
```

2. **Clone and configure:**

```bash
git clone <your-repo-url> /opt/hunter-irrigation
cd /opt/hunter-irrigation
pnpm install
```

3. **Configure environment:**

Edit `.env` and service-specific env files with production values.

4. **Build and start:**

```bash
pnpm docker:build
pnpm docker:up
```

5. **Run migrations:**

```bash
cd apps/api
pnpm run migration:run
pnpm run seed
```

6. **Configure DNS:**

Point your domains to the server IP:
- `hunterirrigationsupply.com` → Server IP
- `hunterirrigation.ca` → Server IP

7. **SSL/TLS:**

Caddy will automatically provision Let's Encrypt certificates when domains are properly configured.

### Environment Variables

See `.env.example` files in each app directory for required variables.

## License

Proprietary

