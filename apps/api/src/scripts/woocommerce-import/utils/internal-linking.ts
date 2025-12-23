/**
 * Internal Linking Utility
 * Adds internal links to related products, brands, and collections in descriptions
 */

import { ImportedProduct } from '../types';

/**
 * Find product mentions in description and create links
 */
export function addInternalLinks(
  description: string,
  allProducts: ImportedProduct[],
  baseUrl: string = ''
): string {
  let linkedDescription = description;

  // Find part number mentions (SKU patterns)
  for (const product of allProducts) {
    const sku = product.sku;
    const slug = product.translations[0]?.slug || '';

    if (!sku || !slug) continue;

    // Create regex to find SKU mentions (not already in links)
    const skuPattern = new RegExp(`\\b${escapeRegex(sku)}\\b(?![^\\[]*\\])`, 'gi');
    
    // Replace with markdown link
    const link = `[${sku}](/product/${slug})`;
    linkedDescription = linkedDescription.replace(skuPattern, link);
  }

  return linkedDescription;
}

/**
 * Add brand links to description
 */
export function addBrandLinks(
  description: string,
  brandName: string,
  brandSlug?: string,
  baseUrl: string = ''
): string {
  if (!brandName || !brandSlug) {
    return description;
  }

  // Find brand mentions (not already in links)
  const brandPattern = new RegExp(`\\b${escapeRegex(brandName)}\\b(?![^\\[]*\\])`, 'gi');
  const link = `[${brandName}](/brand/${brandSlug})`;
  
  return description.replace(brandPattern, link);
}

/**
 * Add collection/category links to description
 */
export function addCollectionLinks(
  description: string,
  categories: string[],
  categorySlugMap: Map<string, string>,
  baseUrl: string = ''
): string {
  let linkedDescription = description;

  for (const category of categories) {
    const slug = categorySlugMap.get(category);
    if (!slug) continue;

    // Find category mentions (not already in links)
    const categoryPattern = new RegExp(`\\b${escapeRegex(category)}\\b(?![^\\[]*\\])`, 'gi');
    const link = `[${category}](/collections/${slug})`;
    
    linkedDescription = linkedDescription.replace(categoryPattern, link);
  }

  return linkedDescription;
}

/**
 * Generate collection slug map from category paths
 */
export function generateCollectionSlugMap(
  categoryPaths: string[]
): Map<string, string> {
  const slugMap = new Map<string, string>();

  for (const path of categoryPaths) {
    const parts = path.split('>').map(p => p.trim());
    const lastPart = parts[parts.length - 1];
    const slug = slugify(lastPart);
    slugMap.set(path, slug);
    slugMap.set(lastPart, slug);
  }

  return slugMap;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Slugify text
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Enhance description with internal links
 */
export function enhanceDescriptionWithLinks(
  description: string,
  product: ImportedProduct,
  allProducts: ImportedProduct[],
  brandSlug?: string,
  categorySlugMap?: Map<string, string>
): string {
  let enhanced = description;

  // Add product links
  enhanced = addInternalLinks(enhanced, allProducts);

  // Add brand links
  if (product.brand && brandSlug) {
    enhanced = addBrandLinks(enhanced, product.brand, brandSlug);
  }

  // Add collection links
  if (product.categories && categorySlugMap) {
    enhanced = addCollectionLinks(enhanced, product.categories, categorySlugMap);
  }

  return enhanced;
}

