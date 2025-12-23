/**
 * SEO Head Component
 * Reusable component that injects JSON-LD schemas into the page head
 */

import {
  generateProductSchema,
  generateCollectionPageSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  schemaToJsonLd,
  type ProductSchemaData,
  type CollectionPageSchemaData,
  type OrganizationSchemaData,
  type BreadcrumbSchemaData,
} from '~/lib/seo';

interface SeoHeadProps {
  type: 'product' | 'collection' | 'organization' | 'breadcrumb' | 'faq';
  data:
    | ProductSchemaData
    | CollectionPageSchemaData
    | OrganizationSchemaData
    | BreadcrumbSchemaData
    | { faqs: FAQItem[] };
}

export function SeoHead({ type, data }: SeoHeadProps) {
  let schema: object;

  switch (type) {
    case 'product':
      schema = generateProductSchema(data as ProductSchemaData);
      break;
    case 'collection':
      schema = generateCollectionPageSchema(data as CollectionPageSchemaData);
      break;
    case 'organization':
      schema = generateOrganizationSchema(data as OrganizationSchemaData);
      break;
    case 'breadcrumb':
      schema = generateBreadcrumbSchema(data as BreadcrumbSchemaData);
      break;
    case 'faq':
      schema = generateFAQSchema((data as { faqs: FAQItem[] }).faqs);
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: schemaToJsonLd(schema) }}
    />
  );
}
