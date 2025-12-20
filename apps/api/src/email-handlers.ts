import { RequestContext } from '@vendure/core';

/**
 * Helper functions for channel-specific email addresses
 * - US channel: orders@hunterirrigationsupply.com
 * - CA channel: orders@hunterirrigation.ca
 * - From name: "Hunter Irrigation Supply" (same for both)
 */

// Helper function to get channel-specific from address
export function getFromAddressForChannel(ctx: RequestContext | undefined): string {
  if (!ctx || !ctx.channel) {
    return 'orders@hunterirrigationsupply.com'; // Default to US
  }
  
  const channelCode = ctx.channel.code?.toLowerCase();
  
  if (channelCode === 'ca') {
    return 'orders@hunterirrigation.ca';
  }
  
  // Default to US channel
  return 'orders@hunterirrigationsupply.com';
}

// Helper function to get from name (same for both channels)
export function getFromName(): string {
  return process.env.EMAIL_FROM_NAME || 'Hunter Irrigation Supply';
}

/**
 * Note: Channel-specific email handler implementation
 * 
 * The EmailEventListener API in Vendure requires specific event types.
 * For now, we'll handle channel-specific addresses in email templates
 * and when sending emails programmatically.
 * 
 * To implement full channel-specific handling, we would need to:
 * 1. Create handlers for specific email events (OrderPlacedEvent, etc.)
 * 2. Or use a custom EmailSender that wraps the default sender
 * 
 * For now, the helper functions above can be used in:
 * - Email templates (via templateVars)
 * - Programmatic email sending (like in send-test-email.ts)
 */

