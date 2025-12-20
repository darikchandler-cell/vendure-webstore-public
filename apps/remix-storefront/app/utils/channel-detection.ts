/**
 * Channel Detection and Configuration
 * 
 * Detects the appropriate Vendure channel based on the request hostname
 * and provides channel token configuration for GraphQL requests.
 */

export type ChannelCode = 'us' | 'ca';

export interface ChannelConfig {
  code: ChannelCode;
  token: string;
}

/**
 * Detects the channel based on the request hostname
 * 
 * @param request - The incoming request
 * @returns The detected channel code
 */
export function detectChannel(request: Request): ChannelCode {
  const hostname = new URL(request.url).hostname.toLowerCase();
  
  // Check for Canadian domain (hunterirrigation.ca)
  if (hostname === 'hunterirrigation.ca' || hostname.endsWith('.hunterirrigation.ca')) {
    return 'ca';
  }
  
  // Default to US channel (hunterirrigationsupply.com)
  // This will also handle localhost and other development domains
  return 'us';
}

/**
 * Gets the channel token for the specified channel code
 * 
 * @param channelCode - The channel code ('us' or 'ca')
 * @returns The channel token from environment variables
 */
export function getChannelToken(channelCode: ChannelCode): string {
  if (channelCode === 'us') {
    return process.env.US_CHANNEL_TOKEN || '';
  }
  
  return process.env.CA_CHANNEL_TOKEN || '';
}

/**
 * Gets the full channel configuration for a request
 * 
 * @param request - The incoming request
 * @returns Channel configuration with code and token
 */
export function getChannelConfig(request: Request): ChannelConfig {
  const code = detectChannel(request);
  const token = getChannelToken(code);
  
  return { code, token };
}

/**
 * Gets the API URL with shop-api endpoint
 * 
 * @returns The full Vendure Shop API URL
 */
export function getVendureApiUrl(): string {
  const baseUrl = typeof process !== 'undefined'
    ? process.env.VENDURE_API_URL || process.env.PUBLIC_VENDURE_API_URL
    : undefined;
  
  if (!baseUrl) {
    return 'https://readonlydemo.vendure.io/shop-api';
  }
  
  // Ensure the URL ends with /shop-api
  if (baseUrl.endsWith('/shop-api')) {
    return baseUrl;
  }
  
  // Remove trailing slash if present
  const cleanUrl = baseUrl.replace(/\/$/, '');
  return `${cleanUrl}/shop-api`;
}

