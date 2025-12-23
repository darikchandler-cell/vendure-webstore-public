/**
 * Product Transformer
 * Transforms WooCommerce product data to Vendure format
 */

import { WooCommerceProduct, ImportedProduct, ProductTranslation } from './types';
import { generateSEOTitle, generateMetaDescription, extractKeywords, generateSlug } from './utils/seo-optimizer';
import { cleanHtmlToMarkdown, cleanShortDescription, extractUseCases, extractCompatibility, preserveManufacturerLinks } from './utils/html-cleaner';
import { calculatePrices } from './utils/price-calculator';
import { parseImageUrls } from './utils/asset-handler';
import { LanguageCode } from '@vendure/core';

/**
 * Transform WooCommerce product to ImportedProduct format
 */
export function transformProduct(
  wcProduct: WooCommerceProduct,
  targetLanguages: LanguageCode[] = [LanguageCode.en]
): ImportedProduct {
  // Generate SEO-optimized title
  const seoTitle = generateSEOTitle(wcProduct);
  const metaDesc = generateMetaDescription(wcProduct);
  const keywords = extractKeywords(wcProduct);

  // Clean descriptions
  let cleanDescription = preserveManufacturerLinks(wcProduct.Description || '');
  const cleanShortDesc = cleanShortDescription(wcProduct['Short description'] || '');

  // Generate translations
  const translations: ProductTranslation[] = targetLanguages.map(langCode => {
    // For now, use English for all languages (translations will be added later)
    // In production, this would call a translation service
    return {
      languageCode: langCode.toString(),
      name: langCode === LanguageCode.en ? seoTitle : seoTitle, // TODO: Translate
      slug: generateSlug(seoTitle),
      description: langCode === LanguageCode.en ? cleanDescription : cleanDescription, // TODO: Translate
      shortDescription: langCode === LanguageCode.en ? cleanShortDesc : cleanShortDesc, // TODO: Translate
      metaTitle: seoTitle,
      metaDescription: metaDesc,
    };
  });

  // Calculate prices
  const prices = calculatePrices(
    wcProduct['Regular price'],
    wcProduct['Sale price']
  );

  // Parse categories
  const categories = wcProduct.Categories
    ? wcProduct.Categories.split('>').map(c => c.trim()).filter(c => c.length > 0)
    : [];

  // Parse tags
  const tags = wcProduct.Tags
    ? wcProduct.Tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : [];

  // Parse images
  const images = parseImageUrls(wcProduct.Images || '');

  // Extract brand
  const brand = wcProduct.Brands?.split(',')[0]?.trim() || '';

  // Extract use cases and compatibility
  const useCases = extractUseCases(wcProduct.Description || '');
  const compatibility = extractCompatibility(wcProduct.Description || '');

  // Determine application category
  const applicationCategory = determineApplicationCategory(wcProduct);

  // Determine audience
  const audience = determineAudience(wcProduct);

  // Get manufacturer URL
  const manufacturerUrl = getManufacturerUrl(brand);

  // Parse dimensions and weight
  const weight = parseFloat(wcProduct['Weight (lbs)'] || '0') * 453.592; // Convert lbs to grams
  const length = parseFloat(wcProduct['Length (in)'] || '0') * 25.4; // Convert inches to mm
  const width = parseFloat(wcProduct['Width (in)'] || '0') * 25.4;
  const height = parseFloat(wcProduct['Height (in)'] || '0') * 25.4;

  return {
    sku: wcProduct.SKU,
    upc: wcProduct['GTIN, UPC, EAN, or ISBN'] || undefined,
    brand: brand || undefined,
    translations,
    regularPrice: prices.regularPrice,
    salePrice: prices.salePrice,
    categories,
    tags,
    images,
    weight: weight > 0 ? Math.round(weight) : undefined,
    length: length > 0 ? Math.round(length) : undefined,
    width: width > 0 ? Math.round(width) : undefined,
    height: height > 0 ? Math.round(height) : undefined,
    stock: wcProduct.Stock ? parseInt(wcProduct.Stock, 10) : undefined,
    inStock: wcProduct['In stock?'] === '1',
    useCase: useCases.length > 0 ? useCases : undefined,
    applicationCategory,
    audience,
    compatibility: compatibility.length > 0 ? compatibility : undefined,
    manufacturerUrl,
  };
}

/**
 * Determine application category
 */
function determineApplicationCategory(product: WooCommerceProduct): string | undefined {
  const name = product.Name.toLowerCase();
  const categories = product.Categories?.toLowerCase() || '';

  if (name.includes('irrigation') || categories.includes('irrigation')) {
    return 'Irrigation Control';
  }
  if (name.includes('lighting') || name.includes('luminaire') || categories.includes('lighting')) {
    return 'Landscape Lighting';
  }
  if (name.includes('sensor')) {
    return 'Irrigation Sensor';
  }
  if (name.includes('sprinkler') || name.includes('rotor')) {
    return 'Irrigation Sprinkler';
  }
  if (name.includes('valve')) {
    return 'Irrigation Valve';
  }

  return undefined;
}

/**
 * Determine audience type
 */
function determineAudience(product: WooCommerceProduct): string | undefined {
  const name = product.Name.toLowerCase();
  const description = product.Description?.toLowerCase() || '';

  const isCommercial = name.includes('commercial') ||
    name.includes('commercial') ||
    description.includes('commercial') ||
    description.includes('large-scale') ||
    description.includes('property management');

  const isProfessional = name.includes('professional') ||
    description.includes('professional') ||
    description.includes('contractor') ||
    description.includes('landscaper');

  if (isCommercial || isProfessional) {
    return 'Professional Landscapers, Commercial Property Managers';
  }

  return 'Homeowners, Professional Landscapers';
}

/**
 * Get manufacturer URL based on brand
 */
function getManufacturerUrl(brand: string): string | undefined {
  const brandLower = brand.toLowerCase();

  if (brandLower.includes('hunter')) {
    return 'https://www.hunterirrigation.com';
  }
  if (brandLower.includes('fx') || brandLower.includes('luminaire')) {
    return 'https://www.fxl.com';
  }

  return undefined;
}

