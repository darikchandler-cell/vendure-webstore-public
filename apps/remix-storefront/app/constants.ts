export const APP_META_TITLE = 'Vendure Remix Storefront';
export const APP_META_DESCRIPTION =
  'A headless commerce storefront starter kit built with Remix & Vendure';
export const DEMO_API_URL = 'https://readonlydemo.vendure.io/shop-api';

/**
 * Gets the Vendure API URL, ensuring it includes the /shop-api endpoint
 */
function getApiUrl(): string {
  const baseUrl =
    typeof process !== 'undefined'
      ? process.env.VENDURE_API_URL || process.env.PUBLIC_VENDURE_API_URL
      : undefined;

  if (!baseUrl) {
    return DEMO_API_URL;
  }

  // If already includes /shop-api, return as-is
  if (baseUrl.endsWith('/shop-api')) {
    return baseUrl;
  }

  // Remove trailing slash and append /shop-api
  const cleanUrl = baseUrl.replace(/\/$/, '');
  return `${cleanUrl}/shop-api`;
}

export let API_URL = getApiUrl();

/**
 * This function is used when running in Cloudflare Pages in order to set the API URL
 * based on an environment variable. Env vars work differently in CF Pages and are not available
 * on the `process` object (which does not exist). Instead, it needs to be accessed from the loader
 * context, and if defined we use it here to set the API_URL var which will be used by the
 * GraphQL calls.
 *
 * See https://developers.cloudflare.com/workers/platform/environment-variables/#environmental-variables-with-module-workers
 */
export function setApiUrl(apiUrl: string) {
  API_URL = apiUrl;
}
