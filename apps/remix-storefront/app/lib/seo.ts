/**
 * SEO Helper Functions for JSON-LD Schema Generation
 * Implements Answer Engine Optimization (AEO) for AI search engines
 */

export interface ProductSchemaData {
  name: string;
  description?: string;
  sku?: string;
  upc?: string;
  mpn?: string;
  brand?: string;
  price: number;
  currencyCode: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'InStoreOnly';
  image?: string;
  url: string;
  rating?: {
    value: number;
    count: number;
  };
  category?: string;
  // AEO fields
  useCase?: string[];
  applicationCategory?: string;
  audience?: string;
  compatibility?: string[];
  manufacturerUrl?: string;
}

export interface CollectionPageSchemaData {
  name: string;
  description?: string;
  url: string;
  image?: string;
  items?: Array<{
    name: string;
    url: string;
    image?: string;
  }>;
}

export interface OrganizationSchemaData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[];
}

export interface BreadcrumbSchemaData {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generate Product JSON-LD schema
 * Full Product schema with SKU, Brand, Price, Reviews, Availability
 * Enhanced with AEO (Answer Engine Optimization) fields
 */
export function generateProductSchema(data: ProductSchemaData): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description || data.name,
    url: data.url,
  };

  // Part number identifiers (critical for part number SEO)
  if (data.sku) {
    schema.sku = data.sku;
    schema.mpn = data.sku; // Manufacturer Part Number = SKU
  }

  if (data.upc) {
    schema.gtin = data.upc;
  }

  // Brand information
  if (data.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: data.brand,
    };
  }

  if (data.image) {
    schema.image = data.image;
  }

  if (data.category) {
    schema.category = data.category;
  }

  // AEO fields for AI search engines
  if (data.applicationCategory) {
    schema.applicationCategory = data.applicationCategory;
  }

  if (data.audience) {
    schema.audience = {
      '@type': 'Audience',
      audienceType: data.audience,
    };
  }

  if (data.useCase && data.useCase.length > 0) {
    schema.useCase = data.useCase;
  }

  if (data.compatibility && data.compatibility.length > 0) {
    schema.compatibility = {
      '@type': 'ItemList',
      itemListElement: data.compatibility.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item,
      })),
    };
  }

  if (data.manufacturerUrl) {
    schema.manufacturer = {
      '@type': 'Organization',
      url: data.manufacturerUrl,
    };
  }

  // Offer schema
  schema.offers = {
    '@type': 'Offer',
    price: data.price,
    priceCurrency: data.currencyCode,
    availability: `https://schema.org/${data.availability}`,
    url: data.url,
    itemCondition: 'https://schema.org/NewCondition',
  };

  // AggregateRating if available
  if (data.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.value,
      reviewCount: data.rating.count,
    };
  }

  // Additional properties for technical specs
  if (data.upc || data.sku) {
    schema.additionalProperty = [];
    if (data.sku) {
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'Part Number',
        value: data.sku,
      });
    }
    if (data.upc) {
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'UPC',
        value: data.upc,
      });
    }
  }

  return schema;
}

/**
 * Generate CollectionPage JSON-LD schema
 * For category/collection pages
 */
export function generateCollectionPageSchema(
  data: CollectionPageSchemaData,
): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.name,
    url: data.url,
  };

  if (data.description) {
    schema.description = data.description;
  }

  if (data.image) {
    schema.image = data.image;
  }

  if (data.items && data.items.length > 0) {
    schema.mainEntity = {
      '@type': 'ItemList',
      itemListElement: data.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: item.name,
          url: item.url,
          ...(item.image && { image: item.image }),
        },
      })),
    };
  }

  return schema;
}

/**
 * Generate Organization JSON-LD schema
 * For brand/about pages
 */
export function generateOrganizationSchema(
  data: OrganizationSchemaData,
): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
  };

  if (data.logo) {
    schema.logo = data.logo;
  }

  if (data.description) {
    schema.description = data.description;
  }

  if (data.contactPoint) {
    schema.contactPoint = {
      '@type': 'ContactPoint',
      ...(data.contactPoint.telephone && {
        telephone: data.contactPoint.telephone,
      }),
      ...(data.contactPoint.contactType && {
        contactType: data.contactPoint.contactType,
      }),
      ...(data.contactPoint.email && { email: data.contactPoint.email }),
    };
  }

  if (data.sameAs && data.sameAs.length > 0) {
    schema.sameAs = data.sameAs;
  }

  return schema;
}

/**
 * Generate BreadcrumbList JSON-LD schema
 * For navigation breadcrumbs
 */
export function generateBreadcrumbSchema(data: BreadcrumbSchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Convert schema object to JSON-LD script tag string
 */
export function schemaToJsonLd(schema: object): string {
  return JSON.stringify(schema, null, 2);
}
