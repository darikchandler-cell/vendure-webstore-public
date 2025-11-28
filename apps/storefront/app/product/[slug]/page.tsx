import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';
import { GET_PRODUCT_BY_SLUG } from '@/lib/graphql/queries';
import { createApolloClient } from '@/lib/apollo-client';
import { Metadata } from 'next';
import Link from 'next/link';

async function getProduct(slug: string, channelCode: 'us' | 'ca') {
  const client = createApolloClient(channelCode);
  try {
    const { data } = await client.query({
      query: GET_PRODUCT_BY_SLUG,
      variables: { slug },
    });
    return data?.product || null;
  } catch (error) {
    // Error fetching product
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);
  const product = await getProduct(params.slug, channel.code);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const price = product.variants?.[0]?.priceWithTax
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: product.variants[0].currencyCode,
      }).format(product.variants[0].priceWithTax / 100)
    : '';

  return {
    title: product.name,
    description: product.description || `${product.name} - ${channel.name}`,
    openGraph: {
      title: product.name,
      description: product.description || '',
      images: product.featuredAsset
        ? [
            {
              url: product.featuredAsset.preview,
              alt: product.name,
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || '',
      images: product.featuredAsset ? [product.featuredAsset.preview] : [],
    },
    alternates: {
      canonical: `https://${channel.domain}/product/${params.slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);
  const product = await getProduct(params.slug, channel.code);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/" className="text-primary-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const variant = product.variants?.[0];
  const price = variant
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: variant.currencyCode,
      }).format(variant.priceWithTax / 100)
    : '';

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.featuredAsset?.preview,
    offers: variant
      ? {
          '@type': 'Offer',
          price: variant.price / 100,
          priceCurrency: variant.currencyCode,
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                {channel.name}
              </Link>
              <nav className="flex space-x-8">
                <Link href="/" className="text-gray-700 hover:text-primary-600">
                  Home
                </Link>
                <Link href="/products" className="text-gray-700 hover:text-primary-600">
                  Products
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              <div>
                {product.featuredAsset && (
                  <img
                    src={product.featuredAsset.preview}
                    alt={product.name}
                    className="w-full h-auto rounded-lg"
                  />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                {product.description && (
                  <div
                    className="text-gray-700 mb-6"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}
                {variant && (
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-primary-600 mb-2">{price}</p>
                    <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                  </div>
                )}
                <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

