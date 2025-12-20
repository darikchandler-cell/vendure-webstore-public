import { useLoaderData, useSubmit } from '@remix-run/react';
import { useRef, useState } from 'react';
import { FacetFilterTracker } from '~/components/facet-filter/facet-filter-tracker';
import { filteredSearchLoaderFromPagination } from '~/utils/filtered-search-loader';
import { FiltersButton } from '~/components/FiltersButton';
import { ValidatedForm } from 'remix-validated-form';
import { withZod } from '@remix-validated-form/with-zod';
import { paginationValidationSchema } from '~/utils/pagination';
import { FilterableProductGrid } from '~/components/products/FilterableProductGrid';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '~/components/products/ProductCard';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { SeoHead } from '~/components/seo/SeoHead';

const paginationLimitMinimumDefault = 25;
const allowedPaginationLimits = new Set<number>([
  paginationLimitMinimumDefault,
  50,
  100,
]);
const validator = withZod(paginationValidationSchema(allowedPaginationLimits));

export const { filteredSearchLoader: loader } =
  filteredSearchLoaderFromPagination(
    allowedPaginationLimits,
    paginationLimitMinimumDefault,
  );

export default function Search() {
  const loaderData = useLoaderData<Awaited<typeof loader>>();
  const { result, resultWithoutFacetValueFilters, term, facetValueIds } =
    loaderData;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const facetValuesTracker = useRef(new FacetFilterTracker());
  facetValuesTracker.current.update(
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
  );
  const submit = useSubmit();
  const { t } = useTranslation();

  // Mock AI recommendations - In production, this would come from an AI service
  // For now, we'll show top-rated or featured products related to the search term
  const recommendedProducts =
    term && result.items.length > 0
      ? result.items.slice(0, 4) // Show top 4 results as "recommended"
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-darker to-grey-dark">
      <SeoHead
        type="organization"
        data={{
          name: term ? `Search: ${term}` : 'Search Products',
          description: term
            ? `Search results for "${term}" - Find the perfect products for your project`
            : 'Search our catalog of products',
          url: typeof window !== 'undefined' ? window.location.origin : '',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-5xl font-heading font-light tracking-tight text-white">
            {term
              ? `${t('common.resultsFor') || 'Results for'} "${term}"`
              : t('common.allResults') || 'All Results'}
          </h1>

          <FiltersButton
            filterCount={facetValueIds.length}
            onClick={() => setMobileFiltersOpen(true)}
          />
        </div>

        {/* Recommended for your project section */}
        {term && recommendedProducts.length > 0 && (
          <section className="mb-12" aria-label="Recommended for your project">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <SparklesIcon className="w-6 h-6 text-primary-400" />
                <h2 className="text-2xl font-heading font-semibold text-white">
                  Recommended for your project
                </h2>
              </div>
              <p className="text-white/70 mb-6 text-sm">
                Based on your search for "{term}", here are our top
                recommendations:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((item) => (
                  <ProductCard key={item.productId} {...item} />
                ))}
              </div>
            </div>
          </section>
        )}

        <ValidatedForm
          validator={validator}
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
