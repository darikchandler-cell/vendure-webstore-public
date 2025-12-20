import { DataFunctionArgs, json } from '@remix-run/server-runtime';
import { useState } from 'react';
import { Price } from '~/components/products/Price';
import { getProductBySlug } from '~/providers/products/products';
import {
  FetcherWithComponents,
  ShouldRevalidateFunction,
  useLoaderData,
  useOutletContext,
  MetaFunction,
} from '@remix-run/react';
import { CheckIcon, HeartIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { Breadcrumbs } from '~/components/Breadcrumbs';
import { APP_META_TITLE } from '~/constants';
import { CartLoaderData } from '~/routes/api.active-order';
import { getSessionStorage } from '~/sessions';
import { ErrorCode, ErrorResult } from '~/generated/graphql';
import Alert from '~/components/Alert';
import { StockLevelLabel } from '~/components/products/StockLevelLabel';
import TopReviews from '~/components/products/TopReviews';
import { ScrollableContainer } from '~/components/products/ScrollableContainer';
import { useTranslation } from 'react-i18next';
import { BuyBox } from '~/components/products/BuyBox';
import { TechnicalSpecs } from '~/components/products/TechnicalSpecs';
import { ProductImageCarousel } from '~/components/products/ProductImageCarousel';
import { SeoHead } from '~/components/seo/SeoHead';
import { ProductBadges } from '~/components/products/ProductBadges';
import { extractBadges } from '~/utils/product-badges';
import { trackAddToCart } from '~/utils/monitoring';

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const product = data?.product;
  if (!product) {
    return [{ title: APP_META_TITLE }];
  }

  const selectedVariant = product.variants?.[0];
  const imageUrl = product.featuredAsset?.preview || '';
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${location.pathname}`
      : location.pathname;
  const description = product.description
    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `${product.name} - Available at ${APP_META_TITLE}`;

  return [
    {
      title: `${product.name} - ${APP_META_TITLE}`,
    },
    {
      name: 'description',
      content: description,
    },
    // Open Graph tags for AI crawlers
    {
      property: 'og:type',
      content: 'product',
    },
    {
      property: 'og:title',
      content: product.name,
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: imageUrl,
    },
    {
      property: 'og:url',
      content: fullUrl,
    },
    {
      property: 'product:price:amount',
      content: String(selectedVariant?.priceWithTax || 0),
    },
    {
      property: 'product:price:currency',
      content: selectedVariant?.currencyCode || 'USD',
    },
    {
      property: 'product:availability',
      content:
        selectedVariant?.stockLevel === 'IN_STOCK'
          ? 'in stock'
          : 'out of stock',
    },
    // Twitter Card tags
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: product.name,
    },
    {
      name: 'twitter:description',
      content: description,
    },
    {
      name: 'twitter:image',
      content: imageUrl,
    },
  ];
};

export async function loader({ params, request }: DataFunctionArgs) {
  const { product } = await getProductBySlug(params.slug!, { request });
  if (!product) {
    throw new Response('Not Found', {
      status: 404,
    });
  }
  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    request?.headers.get('Cookie'),
  );
  const error = session.get('activeOrderError');

  // Get the full URL for SEO purposes
  const url = new URL(request.url);
  const productUrl = `${url.origin}${url.pathname}`;

  return json(
    { product: product!, error, productUrl },
    {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    },
  );
}

export const shouldRevalidate: ShouldRevalidateFunction = () => true;

export default function ProductSlug() {
  const { product, error, productUrl } = useLoaderData<typeof loader>();
  const { activeOrderFetcher } = useOutletContext<{
    activeOrderFetcher: FetcherWithComponents<CartLoaderData>;
  }>();
  const { activeOrder } = activeOrderFetcher.data ?? {};
  const addItemToOrderError = getAddItemToOrderError(error);
  const { t } = useTranslation();

  if (!product) {
    return <div>{t('product.notFound')}</div>;
  }

  const findVariantById = (id: string) =>
    product.variants.find((v) => v.id === id);

  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0].id,
  );
  const selectedVariant = findVariantById(selectedVariantId);
  if (!selectedVariant) {
    setSelectedVariantId(product.variants[0].id);
  }

  const qtyInCart =
    activeOrder?.lines.find((l) => l.productVariant.id === selectedVariantId)
      ?.quantity ?? 0;

  const asset = product.assets[0];
  const brandName = product.facetValues.find(
    (fv) => fv.facet.code === 'brand',
  )?.name;

  const [featuredAsset, setFeaturedAsset] = useState(
    selectedVariant?.featuredAsset,
  );

  // Extract badges from product data
  const badges = extractBadges(
    'customFields' in product ? product.customFields : undefined,
    product.facetValues,
  );

  // Extract technical specs from facetValues for AI readability
  const technicalSpecs = product.facetValues
    .filter((fv) => {
      const code = fv.facet.code.toLowerCase();
      return [
        'watts',
        'psi',
        'zone',
        'lumens',
        'gpm',
        'voltage',
        'flow',
        'pressure',
      ].includes(code);
    })
    .map((fv) => ({
      label: fv.facet.name,
      value: fv.name,
    }));

  // Prepare SEO schema data
  const productImage =
    (featuredAsset?.preview || product.featuredAsset?.preview || '') + '?w=800';
  const stockLevel = selectedVariant?.stockLevel || 'OUT_OF_STOCK';
  const availability =
    stockLevel === 'IN_STOCK'
      ? 'InStock'
      : stockLevel === 'OUT_OF_STOCK'
      ? 'OutOfStock'
      : 'PreOrder';

  const handleAddToCart = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set('action', 'addItemToOrder');

    // Track add to cart event
    if (selectedVariant) {
      // Use the slug from the URL pathname since product type doesn't include slug
      const productSlug =
        typeof window !== 'undefined'
          ? window.location.pathname.split('/').pop() || ''
          : '';
      trackAddToCart(productSlug, selectedVariant.priceWithTax);
    }

    activeOrderFetcher.submit(formData, {
      method: 'post',
      action: '/api/active-order',
    });
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = findVariantById(variantId);
    if (variant) {
      setFeaturedAsset(variant.featuredAsset);
    }
  };

  // Breadcrumb data for SEO
  const breadcrumbItems = (
    product.collections[product.collections.length - 1]?.breadcrumbs ?? []
  ).map((bc) => ({
    name: bc.name,
    url:
      typeof window !== 'undefined'
        ? `${window.location.origin}/collections/${bc.slug}`
        : '',
  }));

  return (
    <article className="min-h-screen bg-gradient-to-b from-navy-darker to-grey-dark">
      <SeoHead
        type="product"
        data={{
          name: product.name,
          description:
            product.description?.replace(/<[^>]*>/g, '') || product.name,
          sku: selectedVariant?.sku,
          brand: brandName,
          price: selectedVariant?.priceWithTax || 0,
          currencyCode: selectedVariant?.currencyCode || 'USD',
          availability: availability as
            | 'InStock'
            | 'OutOfStock'
            | 'PreOrder'
            | 'InStoreOnly',
          image: productImage,
          url: productUrl,
          category: product.collections[0]?.name,
        }}
      />
      {breadcrumbItems.length > 0 && (
        <SeoHead type="breadcrumb" data={{ items: breadcrumbItems }} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={
            product.collections[product.collections.length - 1]?.breadcrumbs ??
            []
          }
        />

        <h1 className="text-4xl sm:text-5xl font-heading font-light tracking-tight text-white my-8">
          {product.name}
        </h1>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start mt-8">
          {/* Image Carousel */}
          <section className="w-full relative">
            <ProductImageCarousel
              assets={product.assets}
              featuredAsset={featuredAsset || undefined}
              productName={product.name}
              onAssetChange={setFeaturedAsset}
            />
            {/* Product badges overlay on main image */}
            {badges.length > 0 && (
              <div className="absolute top-4 right-4 z-10">
                <ProductBadges badges={badges} position="overlay" size="md" />
              </div>
            )}
          </section>

          {/* Product Info & Buy Box */}
          <section className="mt-10 lg:mt-0 space-y-6">
            {/* Product Badges - Inline */}
            {badges.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <ProductBadges badges={badges} position="inline" size="md" />
              </div>
            )}

            {/* Description */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="sr-only">{t('product.description')}</h2>
              <div
                className="text-base text-white/80 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: product.description,
                }}
              />
            </div>

            {/* Buy Box */}
            <activeOrderFetcher.Form method="post" action="/api/active-order">
              <input type="hidden" name="action" value="addItemToOrder" />
              <input type="hidden" name="variantId" value={selectedVariantId} />
              <BuyBox
                variants={product.variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  priceWithTax: v.priceWithTax,
                  currencyCode: v.currencyCode,
                  sku: v.sku,
                  stockLevel: v.stockLevel,
                }))}
                selectedVariantId={selectedVariantId}
                onVariantChange={handleVariantChange}
                onAddToCart={handleAddToCart}
                qtyInCart={qtyInCart}
                isSubmitting={activeOrderFetcher.state !== 'idle'}
                error={addItemToOrderError}
                shippingAlert={
                  selectedVariant?.stockLevel === 'OUT_OF_STOCK'
                    ? 'Special Order - No Return'
                    : undefined
                }
              />
            </activeOrderFetcher.Form>

            {/* Technical Specs */}
            {technicalSpecs.length > 0 && (
              <TechnicalSpecs specs={technicalSpecs} />
            )}
          </section>
        </div>

        {/* Reviews Section */}
        <section className="mt-24">
          <TopReviews />
        </section>
      </div>
    </article>
  );
}

export function CatchBoundary() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-gray-900 my-8">
        {t('product.notFound')}
      </h2>
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start mt-4 md:mt-12">
        {/* Image gallery */}
        <div className="w-full max-w-2xl mx-auto sm:block lg:max-w-none">
          <span className="rounded-md overflow-hidden">
            <div className="w-full h-96 bg-slate-200 rounded-lg flex content-center justify-center">
              <PhotoIcon className="w-48 text-white"></PhotoIcon>
            </div>
          </span>
        </div>

        {/* Product info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
          <div className="">{t('product.notFoundInfo')}</div>
          <div className="flex-1 space-y-3 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAddItemToOrderError(error?: ErrorResult): string | undefined {
  if (!error || !error.errorCode) {
    return undefined;
  }
  switch (error.errorCode) {
    case ErrorCode.OrderModificationError:
    case ErrorCode.OrderLimitError:
    case ErrorCode.NegativeQuantityError:
    case ErrorCode.InsufficientStockError:
      return error.message;
  }
}
