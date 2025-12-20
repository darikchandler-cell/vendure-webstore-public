import { SearchQuery } from '~/generated/graphql';
import { Link } from '@remix-run/react';
import { Price } from './Price';
import { ProductBadges } from './ProductBadges';
import { ProductBadge as BadgeType } from '~/utils/product-badges';

export type ProductCardProps = SearchQuery['search']['items'][number] & {
  badges?: BadgeType[];
  sku?: string;
};

export function ProductCard({
  productAsset,
  productName,
  slug,
  priceWithTax,
  currencyCode,
  sku,
  badges,
}: ProductCardProps) {
  // Extract brand from facetValues
  // Note: The search query currently doesn't include facetValues in the ListedProduct fragment
  // To enable brand display, update the GraphQL query in app/providers/products/products.ts
  // to include facetValues with facet.code === 'brand' in the search results
  const brand = undefined; // Will be populated when facetValues are added to search query

  return (
    <article className="glass-card rounded-xl overflow-hidden group hover:animate-lift-glow transition-all duration-300">
      <Link
        className="flex flex-col h-full"
        prefetch="intent"
        to={`/products/${slug}`}
      >
        <div className="relative overflow-hidden aspect-[7/8]">
          <img
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            alt={productName}
            src={productAsset?.preview + '?w=300&h=400'}
            loading="lazy"
          />
          {/* Product badges overlay */}
          {badges && badges.length > 0 && (
            <ProductBadges
              badges={badges}
              position="overlay"
              maxVisible={3}
              size="sm"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          {brand && (
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">
              {brand}
            </div>
          )}
          <h3 className="text-sm font-medium text-white/90 mb-2 line-clamp-2 group-hover:text-white transition-colors">
            {productName}
          </h3>
          {sku && (
            <div className="text-xs text-white/50 mb-2 font-mono">
              SKU: {sku}
            </div>
          )}
          <div className="mt-auto text-base font-semibold text-white">
            <Price priceWithTax={priceWithTax} currencyCode={currencyCode} />
          </div>
        </div>
      </Link>
    </article>
  );
}
