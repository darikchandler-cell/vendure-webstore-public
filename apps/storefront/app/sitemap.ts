import { MetadataRoute } from 'next';
import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';
import { GET_PRODUCTS } from '@/lib/graphql/queries';
import { createApolloClient } from '@/lib/apollo-client';

async function getProducts(channelCode: 'us' | 'ca') {
  const client = createApolloClient(channelCode);
  try {
    const { data } = await client.query({
      query: GET_PRODUCTS,
      variables: {
        options: {
          take: 1000,
        },
      },
    });
    return data?.products?.items || [];
  } catch (error) {
    // Error fetching products for sitemap
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);
  const products = await getProducts(channel.code);
  const baseUrl = `https://${channel.domain}`;

  const productUrls = products.map((product: any) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productUrls,
  ];
}

