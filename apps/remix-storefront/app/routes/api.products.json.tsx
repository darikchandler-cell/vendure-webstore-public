import { DataFunctionArgs, json } from '@remix-run/server-runtime';
import { search } from '~/providers/products/products';
import { getProductBySlug } from '~/providers/products/products';
import { generateProductSchema } from '~/lib/seo';

/**
 * API endpoint for structured product data in JSON-LD format
 * Optimized for AI/LLM crawlers and Answer Engine Optimization (AEO)
 *
 * Usage:
 * - GET /api/products.json - Returns all products as JSON-LD array
 * - GET /api/products.json?slug=product-slug - Returns single product as JSON-LD
 */
export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const origin = url.origin;
  const slug = url.searchParams.get('slug');

  // Single product request
  if (slug) {
    const { product } = await getProductBySlug(slug, { request });

    if (!product) {
      return json({ error: 'Product not found' }, { status: 404 });
    }

    const selectedVariant = product.variants[0];
    const stockLevel = selectedVariant?.stockLevel || 'OUT_OF_STOCK';
    const availability =
      stockLevel === 'IN_STOCK'
        ? 'InStock'
        : stockLevel === 'OUT_OF_STOCK'
        ? 'OutOfStock'
        : 'PreOrder';

    const brandName = product.facetValues.find(
      (fv) => fv.facet.code === 'brand',
    )?.name;

    // Extract AEO fields from customFields
    const customFields = product.customFields as any;
    const upc = selectedVariant?.customFields?.upc;

    const productSchema = generateProductSchema({
      name: product.name,
      description: product.description?.replace(/<[^>]*>/g, '') || product.name,
      sku: selectedVariant?.sku,
      upc: upc,
      mpn: selectedVariant?.sku, // MPN = SKU
      brand: brandName,
      price: selectedVariant?.priceWithTax || 0,
      currencyCode: selectedVariant?.currencyCode || 'USD',
      availability: availability as
        | 'InStock'
        | 'OutOfStock'
        | 'PreOrder'
        | 'InStoreOnly',
      image: product.featuredAsset?.preview || '',
      url: `${origin}/products/${slug}`,
      category: product.collections[0]?.name,
      // AEO fields
      useCase: customFields?.useCase,
      applicationCategory: customFields?.applicationCategory,
      audience: customFields?.audience,
      compatibility: customFields?.compatibility,
      manufacturerUrl: customFields?.manufacturerUrl,
    });

    return json(productSchema, {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Access-Control-Allow-Origin': '*', // Allow LLM crawlers
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  // All products request (paginated) - returns simplified product list with AEO fields
  // Note: For full product details, use the single product endpoint
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '50', 10),
    100,
  );
  const skip = (page - 1) * limit;

  const productSearch = await search(
    {
      input: {
        groupByProduct: true,
        take: limit,
        skip,
      },
    },
    { request },
  );

  // Return simplified product list with AEO fields
  const productList = productSearch.search.items.map((item) => {
    const price =
      typeof item.priceWithTax === 'object' && 'value' in item.priceWithTax
        ? item.priceWithTax.value
        : typeof item.priceWithTax === 'object' && 'min' in item.priceWithTax
        ? item.priceWithTax.min
        : 0;

    const customFields = item.customFields as any;
    const variant = 'variants' in item && item.variants?.[0];
    const variantCustomFields = variant && 'customFields' in variant ? (variant as any).customFields : {};

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.productName,
      url: `${origin}/products/${item.slug}`,
      sku: 'sku' in item ? item.sku : undefined,
      mpn: 'sku' in item ? item.sku : undefined,
      gtin: variantCustomFields?.upc,
      image: item.productAsset?.preview || '',
      // AEO fields
      applicationCategory: customFields?.applicationCategory,
      audience: customFields?.audience,
      useCase: customFields?.useCase,
      compatibility: customFields?.compatibility,
      manufacturer: customFields?.manufacturerUrl ? {
        '@type': 'Organization',
        url: customFields.manufacturerUrl,
      } : undefined,
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: item.currencyCode,
        availability: 'https://schema.org/InStock',
        url: `${origin}/products/${item.slug}`,
      },
    };
  });

  return json(
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: productSearch.search.totalItems,
      itemListElement: productList,
    },
    {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Access-Control-Allow-Origin': '*', // Allow LLM crawlers
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    },
  );
}
