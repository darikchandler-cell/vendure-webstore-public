# Product Badges & Icons Implementation

## Overview

This implementation adds a flexible product badge and icon system that displays on product cards (catalog view) and product detail pages. Badges are managed in the backend and displayed automatically when present.

## Architecture

### Components Created

1. **`app/utils/product-badges.ts`** - Core badge configuration and utilities

   - Defines badge types (wifi-compatible, bluetooth, waterproof, etc.)
   - Maps badge types to icons and styling
   - Provides `extractBadges()` function to parse badge data from product

2. **`app/components/products/ProductBadge.tsx`** - Individual badge component

   - Displays a single badge with icon and/or label
   - Supports 3 variants: `icon`, `badge`, `icon-badge`

3. **`app/components/products/ProductBadges.tsx`** - Badge container component
   - Manages multiple badges
   - Supports overlay (for product cards) and inline (for detail pages) positioning

### Updated Components

1. **`app/components/products/ProductCard.tsx`**

   - Added optional `badges` prop
   - Displays badges as overlay on product image (top-right)
   - Shows up to 3 badges by default

2. **`app/routes/products.$slug.tsx`** (Product Detail Page)

   - Extracts badges from `product.customFields` and `product.facetValues`
   - Displays badges both as overlay on main image and inline in product info section

3. **`app/providers/products/products.ts`**
   - Updated `detailedProductFragment` to include `customFields` in GraphQL query

## Backend Requirements

The backend needs to provide badge data in one of two ways:

### Option 1: Custom Fields (Recommended)

Store badges in `product.customFields.badges` as a JSON array:

```json
{
  "badges": [
    { "type": "wifi-compatible" },
    { "type": "new", "label": "New Arrival" },
    { "type": "bestseller", "variant": "icon-badge" }
  ]
}
```

**Badge Object Structure:**

- `type` (required): One of the defined badge types (see `BadgeType` in `product-badges.ts`)
- `label` (optional): Custom label override (defaults to badge config label)
- `variant` (optional): Display variant - `icon`, `badge`, or `icon-badge` (defaults to badge config)
- `position` (optional): Position override (defaults to badge config)

### Option 2: Facet Values

Create a facet with code `badges` or `product-badges` and assign facet values that match badge type codes:

- Facet code: `badges` or `product-badges`
- Facet value codes should match badge types (e.g., `wifi-compatible`, `bluetooth`, etc.)

The system will automatically detect and convert matching facet values to badges.

## Supported Badge Types

Currently configured badge types:

- `wifi-compatible` - Wi-Fi Compatible (icon)
- `bluetooth` - Bluetooth (icon)
- `waterproof` - Waterproof (icon)
- `energy-star` - Energy Star (icon-badge)
- `new` - New (badge)
- `sale` - Sale (badge)
- `bestseller` - Bestseller (icon-badge)
- `limited-edition` - Limited Edition (badge)
- `premium` - Premium (icon-badge)
- `eco-friendly` - Eco-Friendly (icon-badge)

### Adding New Badge Types

1. Add the badge type to `BadgeType` union in `app/utils/product-badges.ts`
2. Add configuration to `BADGE_CONFIGS` object with:
   - Icon component (from Heroicons or custom)
   - Default label
   - Default position
   - Default variant
   - Color classes

Example:

```typescript
'new-badge-type': {
  type: 'new-badge-type',
  icon: YourIconComponent,
  defaultLabel: 'New Badge',
  defaultPosition: 'top-right',
  defaultVariant: 'icon',
  colorClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  iconColorClass: 'text-blue-400',
},
```

## Display Behavior

### Product Cards (Catalog View)

- Badges appear as overlay on product image (top-right)
- Maximum 3 badges shown by default
- Small size icons/badges
- Glassmorphism styling to match design system

### Product Detail Page

- Badges appear in two places:
  1. Overlay on main product image (top-right)
  2. Inline section above product description
- Medium size icons/badges
- Full badge list displayed

## Styling

Badges use:

- Glassmorphism effects (backdrop-blur, semi-transparent backgrounds)
- Border styling with color-coded themes
- Responsive sizing (sm, md, lg)
- Accessible labels and ARIA attributes

## Testing

To test the implementation:

1. **Backend Setup**: Add badge data to a product's `customFields`:

   ```json
   {
     "badges": [{ "type": "wifi-compatible" }, { "type": "new" }]
   }
   ```

2. **Verify Display**:

   - Check product card in catalog view shows badges on image
   - Check product detail page shows badges in both locations
   - Verify badges are clickable/accessible

3. **Test Edge Cases**:
   - Products with no badges (should show nothing)
   - Products with many badges (should limit display)
   - Invalid badge types (should be filtered out)

## Future Enhancements

Potential improvements:

- Badge filtering/sorting
- Badge tooltips with descriptions
- Badge click actions (filter by badge type)
- Custom badge icons from backend
- Badge animations/transitions
- Badge analytics tracking

## Notes

- Badges are optional - components gracefully handle missing badge data
- Badge extraction prioritizes `customFields.badges` over facet values
- Badge types are type-safe via TypeScript
- Icons use Heroicons React library (already in dependencies)
