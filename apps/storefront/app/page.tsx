import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';
import Link from 'next/link';
import { GET_PRODUCTS } from '@/lib/graphql/queries';
import { createApolloClient } from '@/lib/apollo-client';

async function getProducts(channelCode: 'us' | 'ca') {
  const client = createApolloClient(channelCode);
  try {
    const { data } = await client.query({
      query: GET_PRODUCTS,
      variables: {
        options: {
          take: 6,
        },
      },
    });
    return data?.products?.items || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function HomePage() {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);
  const products = await getProducts(channel.code);

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex justify-start">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                {channel.name}
              </Link>
            </div>
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Irrigation Solutions
          </h1>
          <p className="text-xl text-gray-600">
            High-quality irrigation systems and components for every need
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
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
        </section>
      </main>

      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center">
            © {new Date().getFullYear()} {channel.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

