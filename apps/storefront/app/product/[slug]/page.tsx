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

  // Use custom meta fields if available, otherwise fall back to defaults
  const metaTitle = product.metaTitle || product.name;
  const metaDescription = product.metaDescription || product.shortDescription || product.description || `${product.name} - ${channel.name}`;
  const keywords = product.keywords ? product.keywords.split(',').map(k => k.trim()).join(', ') : undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: product.featuredAsset
        ? [
            {
              url: product.featuredAsset.preview,
              alt: product.name,
            },
          ]
        : [],
      type: 'product',
      ...(product.brand && {
        siteName: product.brand.name,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
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

  // Enhanced JSON-LD structured data with all new fields
  const getStockStatus = (status?: string) => {
    if (!status) return 'https://schema.org/InStock';
    const statusMap: Record<string, string> = {
      'in-stock': 'https://schema.org/InStock',
      'out-of-stock': 'https://schema.org/OutOfStock',
      'backorder': 'https://schema.org/BackOrder',
      'pre-order': 'https://schema.org/PreOrder',
    };
    return statusMap[status.toLowerCase()] || 'https://schema.org/InStock';
  };

  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.featuredAsset?.preview,
    sku: variant?.sku,
    ...(product.brand && {
      brand: {
        '@type': 'Brand',
        name: product.brand.name,
        ...(product.brand.websiteUrl && { url: product.brand.websiteUrl }),
      },
    }),
    ...(variant && {
      offers: {
        '@type': 'Offer',
        price: variant.price / 100,
        priceCurrency: variant.currencyCode,
        availability: getStockStatus(variant.customStockStatus),
        ...(variant.upc && { gtin: variant.upc }),
      },
    }),
    ...(variant?.weight && {
      weight: {
        '@type': 'QuantitativeValue',
        value: variant.weight,
        unitCode: 'GRM', // grams
      },
    }),
    ...(variant?.length && variant?.width && variant?.height && {
      dimensions: {
        '@type': 'QuantitativeValue',
        length: {
          '@type': 'QuantitativeValue',
          value: variant.length,
          unitCode: 'MMT', // millimeters
        },
        width: {
          '@type': 'QuantitativeValue',
          value: variant.width,
          unitCode: 'MMT',
        },
        height: {
          '@type': 'QuantitativeValue',
          value: variant.height,
          unitCode: 'MMT',
        },
      },
    }),
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
                {product.brand && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 font-medium">{product.brand.name}</span>
                  </div>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                {product.shortDescription && (
                  <p className="text-lg text-gray-700 mb-4">{product.shortDescription}</p>
                )}
                {product.description && (
                  <div
                    className="text-gray-700 mb-6"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}
                {variant && (
                  <div className="mb-6 space-y-2">
                    <p className="text-3xl font-bold text-primary-600 mb-2">{price}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>SKU: {variant.sku}</p>
                      {variant.upc && <p>UPC: {variant.upc}</p>}
                      {variant.customStockStatus && (
                        <p className="capitalize">Status: {variant.customStockStatus.replace('-', ' ')}</p>
                      )}
                      {(variant.weight || variant.length || variant.width || variant.height) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="font-medium text-gray-700 mb-1">Dimensions & Weight:</p>
                          {variant.weight && <p>Weight: {(variant.weight / 1000).toFixed(2)} kg</p>}
                          {variant.length && variant.width && variant.height && (
                            <p>
                              Dimensions: {variant.length}mm × {variant.width}mm × {variant.height}mm
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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

