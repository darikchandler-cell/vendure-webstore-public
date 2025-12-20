# Vendure Remix Storefront Starter

An e-commerce storefront for [Vendure](https://www.vendure.io) built with [Remix](https://remix.run).

👉 [remix-storefront.vendure.io](https://remix-storefront.vendure.io/)

![Screenshot](https://www.vendure.io/blog/2022/05/lightning-fast-headless-commerce-with-vendure-and-remix/lighthouse-score.webp)

## To do

Most Vendure features are already part of this starter. Notable missing Vendure features:

- Default billing/shipping addresses
  - This is part of the account page (https://github.com/vendure-ecommerce/storefront-remix-starter/pull/39) but not yet used in checkout
- Separate billing address in checkout
- Promotions
- Localization
- Multi channel support

General things missing:

- Global input validation
- Sitemap generation
- Metadata

**Contributions welcome!**

## Development

1. Clone this repo
2. `yarn install`
3. Create a `.env` file in the root dir with the following command and update it with your variables:

   ```bash
   cp .env.template .env
   ```

4. `yarn dev` - run the storefront with a local Remix server
5. `yarn dev:cf` - runs locally with the Cloudflare Pages configuration

### Vendure Server

This storefront requires a Vendure V2 server. You can either run a local instance, or use our public demo server.  
If you're looking for V1 support, [75eb880](https://github.com/vendure-ecommerce/storefront-remix-starter/tree/75eb880052d7f76b2026fc917cf545996012e3ac) is the last supported commit.

#### Code Generation

Whenever the Graphql documents (the constants using the `gql` tag) in the [./app/providers](./app/providers) dir changes,
you should run `yarn generate` to generate new sdk definitions.

For a more detailed guide on how to work with code generation, check the wiki about [querying custom fields](https://github.com/vendure-ecommerce/storefront-remix-starter/wiki/Querying-custom-fields).

#### Local

You can set up a local instance, populated with test data by following the instructions in the Vendure [Getting Started guide](https://docs.vendure.io/getting-started/). Note that make sure you have enabled the `bearer` method for managing session tokens:

```ts
// vendure-config.ts
export const config: VendureConfig = {
  authOptions: {
    tokenMethod: ['bearer', 'cookie'], // or just 'bearer'
    // ...
  },
  // ...
};
```

## Payment Gateways

Currently, both Stripe and Braintree are supported out of the box, but only one of them can be used at the same time

### Stripe integration

This repo has a built-in Stripe payment integration. To enable it, ensure that your Vendure server is set up with
the [StripePlugin](https://docs.vendure.io/reference/core-plugins/payments-plugin/stripe-plugin/).

Ensure your new PaymentMethod uses the word `stripe` somewhere in its code, as that's how this integration will know
to load the Stripe payment element.

Then add your Stripe publishable key to the env file:

```
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Important note**: There's a race condition between Stripe redirecting a customer to the confirmation page and the webhook receiving the confirmation in the Vendure backend. As this condition is not very distinguishable from other potential issues, it is currently addressed by implementing a very simple retry system of 5 retries every 2.5s You can tweak these settings in the [CheckoutConfirmation route](./app/routes/checkout/confirmation.%24orderCode.tsx).

### Braintree integration

This repo has built-in Braintree integration. To enable it, ensure that your Vendure server is set up with
the [BraintreePlugin](https://docs.vendure.io/reference/core-plugins/payments-plugin/braintree-plugin/).

Currently, `storeCustomersInBraintree` has to be set to `true` in plugin options.

## Public demo

There is a publicly-available demo instance at https://readonlydemo.vendure.io/shop-api

## Deployment

This repo is configured to deploy to either Netlify or Cloudflare Pages or to build locally with specialised build targets (`build(:nf/:cf)`).

No special setup should be needed, as the [remix.config.js](./remix.config.js) file contains a check for the `process.env.CF_PAGES` / `process.env.NETLIFY` environment variable to determine whether to use the Cloudflare Pages or Netlify server configuration.

Follow the usual procedure for setting up a project in Netlify/CF Pages and point it to your clone of this repo on GitHub/Gitlab.

### Production Deployment Checklist

Before deploying to production, ensure you have:

1. **Set Environment Variables:**

   - `SESSION_SECRET` - A strong random secret (generate with: `openssl rand -base64 32`)
   - `VENDURE_API_URL` - Your Vendure server API URL
   - `NODE_ENV=production`
   - `STRIPE_PUBLISHABLE_KEY` (if using Stripe)
   - `GA_MEASUREMENT_ID` (optional, for analytics)
   - `SENTRY_DSN` (optional, for error monitoring)

2. **Security:**

   - ✅ Session secret is now configured via environment variable (no longer hardcoded)
   - ✅ Security headers are automatically applied
   - ✅ Cookie consent banner is included for GDPR compliance

3. **Legal Pages:**

   - Update `/privacy`, `/terms`, and `/returns` routes with your actual company information

4. **Monitoring:**

   - Set up error monitoring (Sentry) by adding `SENTRY_DSN` environment variable
   - Configure analytics (Google Analytics) by adding `GA_MEASUREMENT_ID` environment variable

5. **Testing:**
   - Run tests: `yarn test`
   - Run build: `yarn build:nf` or `yarn build:cf`

See [.env.template](./.env.template) for all available environment variables.

## License

MIT
