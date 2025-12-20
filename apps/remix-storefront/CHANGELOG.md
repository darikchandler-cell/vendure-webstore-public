# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Environment variable validation on startup
- Comprehensive security headers (CSP, X-Frame-Options, HSTS, etc.)
- Error monitoring support (Sentry integration)
- Analytics tracking (Google Analytics integration)
- Legal pages (Privacy Policy, Terms of Service, Returns Policy)
- Cookie consent banner for GDPR/CCPA compliance
- Enhanced SEO metadata utilities
- Test infrastructure setup (Vitest)
- CI/CD pipeline (GitHub Actions)
- Session secret now uses environment variable instead of hardcoded value
- `.env.template` file for environment configuration

### Security

- Fixed hardcoded session secret - now uses `SESSION_SECRET` environment variable
- Added security headers to all responses
- Improved session cookie security (secure flag in production)

### Changed

- Session storage now requires `SESSION_SECRET` environment variable in production
- Error boundaries now capture errors for monitoring

## [1.0.0] - Initial Release

### Added

- Remix storefront for Vendure
- Product catalog and search
- Shopping cart functionality
- Checkout flow with Stripe and Braintree support
- User authentication and account management
- Order history
- Multi-language support (i18n)
- Responsive design with Tailwind CSS
