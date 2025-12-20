/**
 * Channel detection and configuration
 */

export type ChannelCode = 'us' | 'ca';

export interface ChannelConfig {
  code: ChannelCode;
  token: string;
  currency: string;
  domain: string;
  name: string;
}

const CHANNEL_CONFIGS: Record<ChannelCode, ChannelConfig> = {
  us: {
    code: 'us',
    token: process.env.NEXT_PUBLIC_US_CHANNEL_TOKEN || 'us-channel-token',
    currency: 'USD',
    domain: 'hunterirrigationsupply.com',
    name: 'Hunter Irrigation Supply',
  },
  ca: {
    code: 'ca',
    token: process.env.NEXT_PUBLIC_CA_CHANNEL_TOKEN || 'ca-channel-token',
    currency: 'CAD',
    domain: 'hunterirrigation.ca',
    name: 'Hunter Irrigation',
  },
};

/**
 * Detect channel from hostname
 */
export function detectChannel(hostname?: string): ChannelCode {
  if (!hostname) {
    return 'us'; // Default to US
  }

  const host = hostname.toLowerCase();

  if (host.includes('hunterirrigation.ca')) {
    return 'ca';
  }

  return 'us';
}

/**
 * Get channel configuration
 */
export function getChannelConfig(channelCode: ChannelCode): ChannelConfig {
  return CHANNEL_CONFIGS[channelCode];
}

/**
 * Get current channel config from request headers
 */
export function getChannelFromHeaders(headers: Headers): ChannelConfig {
  const hostname = headers.get('host') || headers.get('x-forwarded-host') || '';
  const channelCode = detectChannel(hostname);
  return getChannelConfig(channelCode);
}

