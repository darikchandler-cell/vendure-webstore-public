import { DataFunctionArgs } from '@remix-run/server-runtime';
import { search } from '~/providers/products/products';
import { getCollections } from '~/providers/collections/collections';

/**
 * Sitemap route for AI/LLM crawlers
 * Generates XML sitemap with all products and collections
 */
export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url);
  const origin = url.origin;

  // Get all products (using search with no filters to get everything)
  const productSearch = await search(
    {
      input: {
        groupByProduct: true,
        take: 1000, // Adjust based on your product count
      },
    },
    { request },
  );

  // Get all collections
  const collections = await getCollections(request, { take: 100 });

  // Build sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${origin}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Collections -->
  ${collections
    .map(
      (collection) => `
  <url>
    <loc>${origin}/collections/${collection.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${
      collection.featuredAsset?.preview
        ? `<image:image><image:loc>${collection.featuredAsset.preview}</image:loc></image:image>`
        : ''
    }
  </url>`,
    )
    .join('')}
  
  <!-- Products -->
  ${productSearch.search.items
    .map(
      (item) => `
  <url>
    <loc>${origin}/products/${item.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    ${
      item.productAsset?.preview
        ? `<image:image><image:loc>${item.productAsset.preview}</image:loc></image:image>`
        : ''
    }
  </url>`,
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  });
}
