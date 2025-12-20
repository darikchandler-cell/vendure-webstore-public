import type { MetaFunction } from '@remix-run/react';

export interface SEOData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  siteName?: string;
  locale?: string;
}

/**
 * Enhanced SEO meta function generator
 * Creates Open Graph, Twitter Cards, and structured data
 */
export function createSEOMeta(data: SEOData): ReturnType<MetaFunction> {
  const {
    title,
    description,
    image,
    url,
    type = 'website',
    siteName = 'Vendure Storefront',
    locale = 'en_US',
  } = data;

  const metaTags: Array<{
    title?: string;
    name?: string;
    property?: string;
    content?: string;
  }> = [];

  // Basic meta tags
  if (title) {
    metaTags.push({ title });
  }
  if (description) {
    metaTags.push({ name: 'description', content: description });
  }

  // Open Graph tags
  if (title) {
    metaTags.push({ property: 'og:title', content: title });
  }
  if (description) {
    metaTags.push({ property: 'og:description', content: description });
  }
  if (type) {
    metaTags.push({ property: 'og:type', content: type });
  }
  if (url) {
    metaTags.push({ property: 'og:url', content: url });
  }
  if (image) {
    metaTags.push({ property: 'og:image', content: image });
  }
  if (siteName) {
    metaTags.push({ property: 'og:site_name', content: siteName });
  }
  if (locale) {
    metaTags.push({ property: 'og:locale', content: locale });
  }

  // Twitter Card tags
  metaTags.push({ name: 'twitter:card', content: 'summary_large_image' });
  if (title) {
    metaTags.push({ name: 'twitter:title', content: title });
  }
  if (description) {
    metaTags.push({ name: 'twitter:description', content: description });
  }
  if (image) {
    metaTags.push({ name: 'twitter:image', content: image });
  }

  return metaTags;
}

/**
 * Generate JSON-LD structured data for products
 */
export function generateProductStructuredData(product: {
  name: string;
  description: string;
  slug: string;
  variants: Array<{
    price: number;
    currencyCode: string;
    sku?: string;
  }>;
  featuredAsset?: {
    preview?: string;
  };
  assets?: Array<{
    preview?: string;
  }>;
  url: string;
}) {
  const lowestPrice = Math.min(...product.variants.map((v) => v.price));
  const currencyCode = product.variants[0]?.currencyCode || 'USD';
  const images = [
    product.featuredAsset?.preview,
    ...(product.assets?.map((a) => a.preview).filter(Boolean) || []),
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    sku: product.variants[0]?.sku,
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: currencyCode,
      price: lowestPrice / 100, // Assuming price is in cents
      availability: 'https://schema.org/InStock',
    },
  };
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
