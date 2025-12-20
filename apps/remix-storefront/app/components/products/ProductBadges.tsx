/**
 * ProductBadges Component
 *
 * Container component for displaying multiple product badges
 * Supports overlay positioning (for product cards) and inline positioning (for detail pages)
 */

import { ProductBadge } from './ProductBadge';
import { ProductBadge as BadgeType } from '~/utils/product-badges';

interface ProductBadgesProps {
  badges: BadgeType[];
  position?: 'overlay' | 'inline';
  maxVisible?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductBadges({
  badges,
  position = 'overlay',
  maxVisible,
  className = '',
  size = 'sm',
}: ProductBadgesProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const visibleBadges = maxVisible ? badges.slice(0, maxVisible) : badges;

  // Overlay position - for product card images
  if (position === 'overlay') {
    return (
      <div
        className={`absolute top-2 right-2 flex flex-col gap-2 z-10 ${className}`}
        aria-label="Product badges"
      >
        {visibleBadges.map((badge, idx) => (
          <ProductBadge
            key={`${badge.type}-${idx}`}
            badge={badge}
            size={size}
          />
        ))}
      </div>
    );
  }

  // Inline position - for product detail pages or other contexts
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      aria-label="Product badges"
    >
      {visibleBadges.map((badge, idx) => (
        <ProductBadge key={`${badge.type}-${idx}`} badge={badge} size={size} />
      ))}
    </div>
  );
}
