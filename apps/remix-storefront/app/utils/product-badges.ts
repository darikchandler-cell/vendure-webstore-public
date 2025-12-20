/**
 * Product Badge System
 *
 * This utility handles product badges and icons that can be displayed
 * on product cards and detail pages. Badge data is managed in the backend
 * and stored in product customFields or facetValues.
 */

import {
  SignalIcon,
  BoltIcon,
  ShieldCheckIcon,
  StarIcon,
  FireIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/solid';

/**
 * Badge types that can be assigned to products
 * Add new badge types here as needed
 */
export type BadgeType =
  | 'wifi-compatible'
  | 'bluetooth'
  | 'waterproof'
  | 'energy-star'
  | 'new'
  | 'sale'
  | 'bestseller'
  | 'limited-edition'
  | 'premium'
  | 'eco-friendly';

/**
 * Badge display position on product cards
 */
export type BadgePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Badge display variant
 */
export type BadgeVariant = 'icon' | 'badge' | 'icon-badge';

/**
 * Product badge definition
 * This structure matches what the backend will provide
 */
export interface ProductBadge {
  type: BadgeType;
  label?: string; // Optional custom label override
  position?: BadgePosition; // Optional position override
  variant?: BadgeVariant; // Optional variant override
}

/**
 * Badge configuration
 * Defines the default icon, label, and styling for each badge type
 */
export interface BadgeConfig {
  type: BadgeType;
  icon: React.ComponentType<{ className?: string }>;
  defaultLabel: string;
  defaultPosition: BadgePosition;
  defaultVariant: BadgeVariant;
  colorClass: string; // Tailwind color classes for badge background/text
  iconColorClass?: string; // Optional icon color override
}

/**
 * Badge configurations map
 * Add new badge types here with their icons and default settings
 */
export const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
  'wifi-compatible': {
    type: 'wifi-compatible',
    icon: SignalIcon,
    defaultLabel: 'Wi-Fi Compatible',
    defaultPosition: 'top-right',
    defaultVariant: 'icon',
    colorClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    iconColorClass: 'text-blue-400',
  },
  bluetooth: {
    type: 'bluetooth',
    icon: SignalIcon, // You may want to use a custom Bluetooth icon
    defaultLabel: 'Bluetooth',
    defaultPosition: 'top-right',
    defaultVariant: 'icon',
    colorClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    iconColorClass: 'text-blue-400',
  },
  waterproof: {
    type: 'waterproof',
    icon: ShieldCheckIcon,
    defaultLabel: 'Waterproof',
    defaultPosition: 'top-right',
    defaultVariant: 'icon',
    colorClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    iconColorClass: 'text-cyan-400',
  },
  'energy-star': {
    type: 'energy-star',
    icon: StarIcon,
    defaultLabel: 'Energy Star',
    defaultPosition: 'top-right',
    defaultVariant: 'icon-badge',
    colorClass: 'bg-green-500/20 text-green-300 border-green-400/30',
    iconColorClass: 'text-green-400',
  },
  new: {
    type: 'new',
    icon: SparklesIcon,
    defaultLabel: 'New',
    defaultPosition: 'top-left',
    defaultVariant: 'badge',
    colorClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  },
  sale: {
    type: 'sale',
    icon: TagIcon,
    defaultLabel: 'Sale',
    defaultPosition: 'top-left',
    defaultVariant: 'badge',
    colorClass: 'bg-red-500/20 text-red-300 border-red-400/30',
  },
  bestseller: {
    type: 'bestseller',
    icon: FireIcon,
    defaultLabel: 'Bestseller',
    defaultPosition: 'top-left',
    defaultVariant: 'icon-badge',
    colorClass: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    iconColorClass: 'text-orange-400',
  },
  'limited-edition': {
    type: 'limited-edition',
    icon: SparklesIcon,
    defaultLabel: 'Limited Edition',
    defaultPosition: 'top-left',
    defaultVariant: 'badge',
    colorClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  },
  premium: {
    type: 'premium',
    icon: StarIcon,
    defaultLabel: 'Premium',
    defaultPosition: 'top-right',
    defaultVariant: 'icon-badge',
    colorClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    iconColorClass: 'text-amber-400',
  },
  'eco-friendly': {
    type: 'eco-friendly',
    icon: ShieldCheckIcon,
    defaultLabel: 'Eco-Friendly',
    defaultPosition: 'top-right',
    defaultVariant: 'icon-badge',
    colorClass: 'bg-green-500/20 text-green-300 border-green-400/30',
    iconColorClass: 'text-green-400',
  },
};

/**
 * Extract badges from product data
 *
 * Badges can come from:
 * 1. product.customFields.badges (array of ProductBadge)
 * 2. product.facetValues (if a 'badges' facet exists)
 *
 * @param customFields - Product customFields JSON object
 * @param facetValues - Array of facet values from the product
 * @returns Array of ProductBadge objects
 */
export function extractBadges(
  customFields?: any,
  facetValues?: Array<{ code: string; name: string; facet?: { code: string } }>,
): ProductBadge[] {
  const badges: ProductBadge[] = [];

  // Extract from customFields.badges (primary method)
  if (customFields?.badges && Array.isArray(customFields.badges)) {
    badges.push(...customFields.badges);
  }

  // Extract from facetValues (secondary method)
  // Look for a facet with code 'badges' or 'product-badges'
  if (facetValues) {
    const badgeFacet = facetValues.find(
      (fv) =>
        fv.facet?.code === 'badges' || fv.facet?.code === 'product-badges',
    );

    if (badgeFacet) {
      // If facet value code matches a badge type, add it
      const badgeType = badgeFacet.code as BadgeType;
      if (BADGE_CONFIGS[badgeType]) {
        badges.push({
          type: badgeType,
          label:
            badgeFacet.name !== badgeFacet.code ? badgeFacet.name : undefined,
        });
      }
    }

    // Also check individual facet values that match badge types
    facetValues.forEach((fv) => {
      const badgeType = fv.code as BadgeType;
      if (
        BADGE_CONFIGS[badgeType] &&
        !badges.find((b) => b.type === badgeType)
      ) {
        badges.push({
          type: badgeType,
          label: fv.name !== fv.code ? fv.name : undefined,
        });
      }
    });
  }

  // Remove duplicates (same type)
  const uniqueBadges = badges.filter(
    (badge, index, self) =>
      index === self.findIndex((b) => b.type === badge.type),
  );

  return uniqueBadges;
}

/**
 * Get badge configuration for a badge type
 */
export function getBadgeConfig(type: BadgeType): BadgeConfig | undefined {
  return BADGE_CONFIGS[type];
}

/**
 * Validate that a badge type exists
 */
export function isValidBadgeType(type: string): type is BadgeType {
  return type in BADGE_CONFIGS;
}
