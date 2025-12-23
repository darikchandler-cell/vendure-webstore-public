/**
 * Google Merchant Center Product Feed
 * XML feed for Google Shopping / Google Merchant Center
 * 
 * Usage: GET /api/feeds/google-merchant.xml?channel=us
 */

import { DataFunctionArgs } from '@remix-run/server-runtime';
import { search } from '~/providers/products/products';
import { mapProductToGoogleMerchant, generateGoogleMerchantFeed } from '~/lib/feeds/google-merchant';

export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const channel = (url.searchParams.get('channel') || 'us') as 'us' | 'ca';
  const origin = url.origin;

  // Get all products
  const productSearch = await search(
    {
      input: {
        groupByProduct: true,
        take: 10000, // Adjust based on your product count
        skip: 0,
      },
    },
    { request },
  );

  // Map products to Google Merchant format
  const googleProducts = productSearch.search.items
    .filter(item => item.productAsset) // Only products with images
    .map(item => {
      // Get variant data
      const variant = 'variants' in item && item.variants?.[0];
      if (!variant) return null;

      return mapProductToGoogleMerchant(
        {
          id: item.productId,
          name: item.productName,
          slug: item.slug,
          description: item.description || '',
          featuredAsset: item.productAsset ? {
            preview: item.productAsset.preview,
          } : undefined,
          collections: item.collections || [],
          facetValues: item.facetValues || [],
          customFields: item.customFields,
        } as any,
        {
          id: variant.id,
          sku: 'sku' in variant ? variant.sku : '',
          priceWithTax: typeof variant.priceWithTax === 'object' && 'value' in variant.priceWithTax
            ? variant.priceWithTax.value
            : typeof variant.priceWithTax === 'object' && 'min' in variant.priceWithTax
            ? variant.priceWithTax.min
            : 0,
          stockLevel: 'stockLevel' in variant ? variant.stockLevel : 'OUT_OF_STOCK',
          customFields: 'customFields' in variant ? variant.customFields : {},
        } as any,
        origin,
        channel
      );
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Generate XML feed
  const xml = generateGoogleMerchantFeed(googleProducts, channel);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

