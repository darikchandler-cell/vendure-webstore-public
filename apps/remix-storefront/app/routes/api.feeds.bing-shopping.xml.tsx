/**
 * Bing Shopping Product Feed
 * XML feed for Bing Shopping / Microsoft Advertising
 * 
 * Usage: GET /api/feeds/bing-shopping.xml?channel=us
 */

import { DataFunctionArgs } from '@remix-run/server-runtime';
import { search } from '~/providers/products/products';
import { mapProductToBingShopping, generateBingShoppingFeed } from '~/lib/feeds/bing-shopping';

export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const channel = (url.searchParams.get('channel') || 'us') as 'us' | 'ca';
  const origin = url.origin;

  // Get all products
  const productSearch = await search(
    {
      input: {
        groupByProduct: true,
        take: 10000,
        skip: 0,
      },
    },
    { request },
  );

  // Map products to Bing Shopping format
  const bingProducts = productSearch.search.items
    .filter(item => item.productAsset)
    .map(item => {
      const variant = 'variants' in item && item.variants?.[0];
      if (!variant) return null;

      return mapProductToBingShopping(
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
  const xml = generateBingShoppingFeed(bingProducts, channel);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}



