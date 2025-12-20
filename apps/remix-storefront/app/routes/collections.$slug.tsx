import { MetaFunction, useLoaderData, useSubmit } from '@remix-run/react';
import { DataFunctionArgs } from '@remix-run/server-runtime';
import { withZod } from '@remix-validated-form/with-zod';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ValidatedForm } from 'remix-validated-form';
import { Breadcrumbs } from '~/components/Breadcrumbs';
import { CollectionCard } from '~/components/collections/CollectionCard';
import { FacetFilterTracker } from '~/components/facet-filter/facet-filter-tracker';
import { FiltersButton } from '~/components/FiltersButton';
import { FilterableProductGrid } from '~/components/products/FilterableProductGrid';
import { APP_META_TITLE, APP_META_DESCRIPTION } from '~/constants';
import { filteredSearchLoaderFromPagination } from '~/utils/filtered-search-loader';
import { sdk } from '../graphqlWrapper';
import { SeoHead } from '~/components/seo/SeoHead';

export const meta: MetaFunction<typeof loader> = ({ data, location }) => {
  const collection = data?.collection;
  if (!collection) {
    return [{ title: APP_META_TITLE }];
  }

  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${location.pathname}`
      : location.pathname;
  const description =
    (collection as any).description ||
    `${collection.name} - Browse our collection at ${APP_META_TITLE}`;

  return [
    {
      title: `${collection.name} - ${APP_META_TITLE}`,
    },
    {
      name: 'description',
      content: description,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:title',
      content: `${collection.name} - ${APP_META_TITLE}`,
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:url',
      content: fullUrl,
    },
    {
      name: 'twitter:card',
      content: 'summary',
    },
    {
      name: 'twitter:title',
      content: `${collection.name} - ${APP_META_TITLE}`,
    },
    {
      name: 'twitter:description',
      content: description,
    },
  ];
};

const paginationLimitMinimumDefault = 25;
const allowedPaginationLimits = new Set<number>([
  paginationLimitMinimumDefault,
  50,
  100,
]);
const { validator, filteredSearchLoader } = filteredSearchLoaderFromPagination(
  allowedPaginationLimits,
  paginationLimitMinimumDefault,
);

export async function loader({ params, request, context }: DataFunctionArgs) {
  const {
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
    term,
  } = await filteredSearchLoader({
    params,
    request,
    context,
  });
  const collection = (await sdk.collection({ slug: params.slug })).collection;
  if (!collection?.id || !collection?.name) {
    throw new Response('Not Found', {
      status: 404,
    });
  }

  // Get the full URL for SEO purposes
  const url = new URL(request.url);
  const collectionUrl = `${url.origin}${url.pathname}`;

  return {
    term,
    collection,
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    appliedPaginationLimit,
    appliedPaginationPage,
    collectionUrl,
  };
}

export default function CollectionSlug() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    collection,
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
    collectionUrl,
  } = loaderData;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const facetValuesTracker = useRef(new FacetFilterTracker());
  facetValuesTracker.current.update(
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
  );
  const submit = useSubmit();
  const { t } = useTranslation();

  // Prepare product items for schema
  const productItems =
    result?.items?.slice(0, 10).map((item) => ({
      name: item.productName,
      url: collectionUrl
        ? `${new URL(collectionUrl).origin}/products/${item.slug}`
        : '',
      image: item.productAsset?.preview,
    })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-darker to-grey-dark">
      <SeoHead
        type="collection"
        data={{
          name: collection.name,
          description:
            ((collection as any).description as string | undefined) ||
            `${collection.name} collection`,
          url: collectionUrl,
          image: (collection as any).featuredAsset?.preview as
            | string
            | undefined,
          items: productItems,
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-5xl font-heading font-light tracking-tight text-white">
            {collection.name}
          </h1>

          <FiltersButton
            filterCount={facetValueIds.length}
            onClick={() => setMobileFiltersOpen(true)}
          />
        </div>

        <Breadcrumbs items={collection.breadcrumbs}></Breadcrumbs>
        {collection.children?.length ? (
          <section
            className="max-w-2xl mx-auto py-16 sm:py-16 lg:max-w-none mb-16"
            aria-label="Sub-collections"
          >
            <h2 className="text-2xl font-heading font-light text-white mb-6">
              {t('product.collections')}
            </h2>
            <div className="grid max-w-xs sm:max-w-none mx-auto sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {collection.children.map((child) => (
                <CollectionCard
                  key={child.id}
                  collection={child}
                ></CollectionCard>
              ))}
            </div>
          </section>
        ) : (
          ''
        )}

        <ValidatedForm
          validator={withZod(validator)}
          method="get"
          onChange={(e) =>
            submit(e.currentTarget, { preventScrollReset: true })
          }
        >
          <FilterableProductGrid
            allowedPaginationLimits={allowedPaginationLimits}
            mobileFiltersOpen={mobileFiltersOpen}
            setMobileFiltersOpen={setMobileFiltersOpen}
            {...loaderData}
          />
        </ValidatedForm>
      </div>
    </div>
  );
}

export function CatchBoundary() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-darker to-grey-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl sm:text-5xl font-heading font-light tracking-tight text-white my-8">
          {t('product.collectionNotFound')}
        </h2>
        <div className="mt-6 grid sm:grid-cols-5 gap-x-4">
          <aside className="space-y-6">
            <div className="h-2 glass-card rounded col-span-1"></div>
            <div className="h-2 glass-card rounded col-span-1"></div>
            <div className="h-2 glass-card rounded col-span-1"></div>
          </aside>
          <div className="sm:col-span-5 lg:col-span-4">
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              <div className="h-64 glass-card rounded"></div>
              <div className="h-64 glass-card rounded"></div>
              <div className="h-64 glass-card rounded"></div>
              <div className="h-64 glass-card rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
