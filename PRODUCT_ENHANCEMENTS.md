# Product Enhancements - WooCommerce Feature Parity

This document describes the product enhancements added to match WooCommerce functionality.

## ✅ Features Added

### 1. **Brand Management**
- New `Brand` entity with full CRUD operations
- Products can be associated with brands via `brandId` custom field
- Brand information includes: name, slug, description, logo, website URL
- GraphQL API: `brands`, `brand(id)`, `brandBySlug(slug)`, `createBrand`, `updateBrand`, `deleteBrand`

### 2. **Product Custom Fields**
- **`brandId`**: Link product to a brand
- **`shortDescription`**: Brief description for listings/previews
- **`metaTitle`**: Custom SEO title (overrides default)
- **`metaDescription`**: SEO meta description
- **`keywords`**: Comma-separated keywords for SEO

### 3. **Product Variant Custom Fields**
- **`weight`**: Product weight in grams (integer)
- **`length`**: Product length in millimeters (integer)
- **`width`**: Product width in millimeters (integer)
- **`height`**: Product height in millimeters (integer)
- **`customStockStatus`**: Custom stock status (e.g., 'in-stock', 'out-of-stock', 'backorder', 'pre-order')
- **`upc`**: Universal Product Code (UPC)

### 4. **SEO Enhancements**
- Enhanced metadata generation using custom fields
- Improved JSON-LD structured data with:
  - Brand information
  - Weight and dimensions
  - Stock status
  - UPC/GTIN codes
- Open Graph and Twitter Card support
- Canonical URLs

## 📁 Files Created/Modified

### New Files
- `apps/api/src/plugins/product-enhancements/entities/brand.entity.ts` - Brand entity
- `apps/api/src/plugins/product-enhancements/brand.service.ts` - Brand service
- `apps/api/src/plugins/product-enhancements/brand.resolver.ts` - GraphQL resolvers
- `apps/api/src/plugins/product-enhancements/product-enhancements.graphql` - GraphQL schema
- `apps/api/src/plugins/product-enhancements/product-enhancements.plugin.ts` - Plugin definition

### Modified Files
- `apps/api/src/vendure-config.ts` - Added plugin and custom fields
- `apps/storefront/lib/graphql/queries.ts` - Updated queries to include new fields
- `apps/storefront/app/product/[slug]/page.tsx` - Enhanced SEO and product display

## 🚀 Setup & Migration

### Automatic Setup (Development)
If `DB_SYNC=true` is set, the schema will be created automatically on next server start.

### Manual Migration (Production)
1. **Create migration** (if needed):
```bash
cd apps/api
pnpm run migration:create
```

2. **Run migrations**:
```bash
pnpm run migration:run
```

The custom fields will be added to the `product` and `product_variant` tables automatically by Vendure.

## 📝 Usage Examples

### Creating a Brand (GraphQL)

```graphql
mutation {
  createBrand(input: {
    name: "Hunter"
    slug: "hunter"
    description: "Hunter Irrigation Products"
    websiteUrl: "https://hunter.com"
  }) {
    id
    name
    slug
  }
}
```

### Updating a Product with Brand

```graphql
mutation {
  updateProduct(input: {
    id: "1"
    customFields: {
      brandId: "brand-uuid-here"
      shortDescription: "High-quality irrigation product"
      metaTitle: "Hunter Rotor - Premium Irrigation"
      metaDescription: "Professional-grade rotor for residential and commercial irrigation systems"
      keywords: "irrigation, rotor, sprinkler, hunter"
    }
  }) {
    id
    name
    customFields {
      brandId
      shortDescription
    }
  }
}
```

### Updating Product Variant

```graphql
mutation {
  updateProductVariants(input: {
    id: "1"
    customFields: {
      weight: 5000  # 5kg in grams
      length: 200  # 200mm
      width: 150    # 150mm
      height: 100   # 100mm
      customStockStatus: "in-stock"
      upc: "012345678901"
    }
  }) {
    id
    sku
    customFields {
      weight
      upc
      customStockStatus
    }
  }
}
```

### Querying Products with All Fields

```graphql
query {
  products {
    items {
      id
      name
      description
      shortDescription
      metaTitle
      metaDescription
      keywords
      brand {
        id
        name
        slug
      }
      variants {
        id
        sku
        weight
        length
        width
        height
        customStockStatus
        upc
      }
    }
  }
}
```

## 🎨 Frontend Display

The product page now displays:
- Brand name (if associated)
- Short description (if available)
- Full description
- Weight and dimensions (if available)
- UPC code (if available)
- Custom stock status (if set)

## 🔍 SEO Improvements

1. **Meta Tags**: Uses `metaTitle` and `metaDescription` if set, otherwise falls back to defaults
2. **Keywords**: Added to meta keywords tag
3. **Structured Data**: Enhanced JSON-LD with:
   - Brand information
   - Weight and dimensions
   - Stock availability status
   - UPC/GTIN codes
4. **Open Graph**: Includes brand information when available
5. **Canonical URLs**: Properly set for each product page

## 📊 Stock Status Values

The `customStockStatus` field accepts these values:
- `in-stock` - Product is available
- `out-of-stock` - Product is not available
- `backorder` - Product can be backordered
- `pre-order` - Product available for pre-order

These map to Schema.org availability values in the JSON-LD structured data.

## 🔄 Next Steps

1. **Import existing data**: Create a script to migrate brands and product data from WooCommerce
2. **Admin UI**: The custom fields will appear in the Vendure Admin UI automatically
3. **Bulk operations**: Consider creating bulk update mutations for mass data import
4. **Search**: Enhance product search to include brand, keywords, and UPC fields

## ⚠️ Notes

- Custom fields are nullable by default, so existing products won't break
- Brand relationship is optional - products can exist without brands
- Weight and dimensions use metric units (grams and millimeters)
- Stock status is separate from Vendure's built-in stock tracking - use `customStockStatus` for display purposes


