import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';
import { GET_PRODUCTS } from '@/lib/graphql/queries';
import { createApolloClient } from '@/lib/apollo-client';
import Link from 'next/link';
import { Metadata } from 'next';

async function getProducts(channelCode: 'us' | 'ca') {
  const client = createApolloClient(channelCode);
  try {
    const { data } = await client.query({
      query: GET_PRODUCTS,
      variables: {
        options: {
          take: 50,
        },
      },
    });
    return data?.products?.items || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);

  return {
    title: 'Products',
    description: `Browse our complete catalog of irrigation products - ${channel.name}`,
  };
}

export default async function ProductsPage() {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);
  const products = await getProducts(channel.code);

  return (
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Products</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {product.featuredAsset && (
                <img
                  src={product.featuredAsset.preview}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h2>
                {product.variants && product.variants[0] && (
                  <p className="text-xl font-bold text-primary-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: product.variants[0].currencyCode,
                    }).format(product.variants[0].priceWithTax / 100)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

