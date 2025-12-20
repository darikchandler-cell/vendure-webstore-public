/**
 * ProductBadge Component
 *
 * Displays a single product badge with icon and/or label
 * Supports three variants: icon-only, badge-only, or icon+badge
 */

import {
  ProductBadge as BadgeType,
  BADGE_CONFIGS,
  getBadgeConfig,
} from '~/utils/product-badges';

interface ProductBadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProductBadge({
  badge,
  size = 'md',
  className = '',
}: ProductBadgeProps) {
  const config = getBadgeConfig(badge.type);
  if (!config) {
    // Badge type not found in config, skip rendering
    return null;
  }

  const IconComponent = config.icon;
  const variant = badge.variant || config.defaultVariant;
  const label = badge.label || config.defaultLabel;

  // Size classes for icons
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Size classes for text
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full p-1.5 backdrop-blur-sm border ${
          config.colorClass
        } ${config.iconColorClass || ''} ${className}`}
        title={label}
        aria-label={label}
      >
        <IconComponent className={iconSizeClasses[size]} />
      </div>
    );
  }

  // Badge-only variant (text only)
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${config.colorClass} ${textSizeClasses[size]} ${className}`}
        title={label}
        aria-label={label}
      >
        {label}
      </span>
    );
  }

  // Icon + Badge variant
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${config.colorClass} ${textSizeClasses[size]} ${className}`}
      title={label}
      aria-label={label}
    >
      <IconComponent
        className={`${iconSizeClasses.sm} ${config.iconColorClass || ''}`}
      />
      <span>{label}</span>
    </div>
  );
}
