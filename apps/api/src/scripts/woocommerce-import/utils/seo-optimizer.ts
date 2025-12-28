/**
 * SEO Optimization Utilities
 * Generates SEO-optimized titles, meta descriptions, and keywords
 */

import { ImportedProduct, WooCommerceProduct } from '../types';

/**
 * Extract brand name from product name or brands field
 */
export function extractBrand(name: string, brandsField?: string): string {
  // Check brands field first
  if (brandsField) {
    const brands = brandsField.split(',').map(b => b.trim());
    if (brands.length > 0) {
      return brands[0];
    }
  }

  // Extract from name
  const brandPatterns = [
    /^Hunter\s+/i,
    /^FX\s+Luminaire\s+/i,
    /^Rain\s+Bird\s+/i,
    /^Orbit\s+/i,
    /^Toro\s+/i,
  ];

  for (const pattern of brandPatterns) {
    if (pattern.test(name)) {
      const match = name.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
  }

  // Default brand detection
  if (name.toLowerCase().includes('hunter')) {
    return 'Hunter Irrigation';
  }
  if (name.toLowerCase().includes('fx luminaire') || name.toLowerCase().includes('fxl')) {
    return 'FX Luminaire';
  }

  return 'Hunter Irrigation'; // Default
}

/**
 * Extract product type from name or categories
 */
export function extractProductType(name: string, categories?: string): string {
  const typePatterns = [
    { pattern: /controller|timer/i, type: 'Controller' },
    { pattern: /transformer/i, type: 'Transformer' },
    { pattern: /sensor/i, type: 'Sensor' },
    { pattern: /sprinkler|rotor|spray/i, type: 'Sprinkler' },
    { pattern: /valve/i, type: 'Valve' },
    { pattern: /nozzle/i, type: 'Nozzle' },
    { pattern: /fixture|light/i, type: 'Lighting Fixture' },
    { pattern: /module/i, type: 'Module' },
    { pattern: /upgrade|kit/i, type: 'Upgrade Kit' },
  ];

  for (const { pattern, type } of typePatterns) {
    if (pattern.test(name)) {
      return type;
    }
  }

  // Check categories
  if (categories) {
    const catLower = categories.toLowerCase();
    if (catLower.includes('controller')) return 'Controller';
    if (catLower.includes('transformer')) return 'Transformer';
    if (catLower.includes('sensor')) return 'Sensor';
    if (catLower.includes('sprinkler')) return 'Sprinkler';
    if (catLower.includes('valve')) return 'Valve';
    if (catLower.includes('lighting')) return 'Lighting';
  }

  return 'Product';
}

/**
 * Extract key feature from short description or name
 */
export function extractKeyFeature(shortDescription?: string, name?: string): string | null {
  const text = (shortDescription || name || '').toLowerCase();
  
  const features = [
    'wi-fi',
    'wifi',
    'smart',
    'zdc',
    'stainless steel',
    'weather-based',
    'bluetooth',
    'hydrawise',
    'luxor',
    'rgbw',
    'color',
    'dimming',
    'zoning',
  ];

  for (const feature of features) {
    if (text.includes(feature)) {
      // Capitalize properly
      if (feature === 'wi-fi' || feature === 'wifi') return 'Wi-Fi';
      if (feature === 'zdc') return 'ZDC';
      if (feature === 'rgbw') return 'RGBW';
      return feature.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  return null;
}

/**
 * Generate SEO-optimized title
 * Format: [Brand] [Part Number] [Product Type/Key Feature] - [Key Spec]
 */
export function generateSEOTitle(product: WooCommerceProduct): string {
  const brand = extractBrand(product.Name, product.Brands);
  const partNumber = product.SKU;
  const productType = extractProductType(product.Name, product.Categories);
  const keyFeature = extractKeyFeature(product['Short description'], product.Name);

  // Build title
  let title = `${brand} ${partNumber}`;

  // Add product type if not already in name
  if (!product.Name.toLowerCase().includes(productType.toLowerCase())) {
    title += ` ${productType}`;
  }

  // Add key feature if available
  if (keyFeature) {
    title += ` ${keyFeature}`;
  }

  // Add key spec if available (e.g., wattage, model number)
  const specMatch = product.Name.match(/(\d+W|\d+-\d+|\d+\.\d+)/i);
  if (specMatch && !title.includes(specMatch[1])) {
    title += ` - ${specMatch[1]}`;
  }

  // Clean up and limit length
  title = title
    .replace(/\s+/g, ' ')
    .trim();

  // Keep under 60 characters when possible, but don't truncate mid-word
  if (title.length > 60) {
    const words = title.split(' ');
    let truncated = '';
    for (const word of words) {
      if ((truncated + ' ' + word).length <= 60) {
        truncated += (truncated ? ' ' : '') + word;
      } else {
        break;
      }
    }
    if (truncated) {
      title = truncated;
    }
  }

  return title;
}

/**
 * Generate meta description
 * Format: [Brand] [Part Number] [Product Type]. [Key Benefit/Feature]. [Use Case/Compatibility].
 */
export function generateMetaDescription(
  product: WooCommerceProduct,
  maxLength: number = 160
): string {
  const brand = extractBrand(product.Name, product.Brands);
  const partNumber = product.SKU;
  const productType = extractProductType(product.Name, product.Categories);
  
  // Start with brand, part number, and type
  let description = `${brand} ${partNumber} ${productType}.`;

  // Extract key benefit from short description
  const shortDesc = product['Short description'] || '';
  const cleanShort = shortDesc.replace(/<[^>]*>/g, '').trim();
  
  if (cleanShort) {
    // Take first sentence or first 80 characters
    const firstSentence = cleanShort.split(/[.!?]/)[0];
    if (firstSentence.length > 0 && firstSentence.length < 100) {
      description += ` ${firstSentence}.`;
    } else {
      const excerpt = cleanShort.substring(0, 80).trim();
      if (excerpt) {
        description += ` ${excerpt}...`;
      }
    }
  }

  // Add compatibility if mentioned
  const compatibilityMatch = product.Description?.match(/compatible with[^.]*/i);
  if (compatibilityMatch && description.length < maxLength - 30) {
    const compat = compatibilityMatch[0].substring(0, 30).trim();
    description += ` ${compat}.`;
  }

  // Trim to max length
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3).trim() + '...';
  }

  return description;
}

/**
 * Extract and compile keywords
 */
export function extractKeywords(product: WooCommerceProduct): string {
  const keywords = new Set<string>();

  // Add brand
  const brand = extractBrand(product.Name, product.Brands);
  if (brand) {
    keywords.add(brand.toLowerCase());
    // Add brand variations
    if (brand.includes('Hunter')) {
      keywords.add('hunter industries');
      keywords.add('hunter irrigation');
    }
    if (brand.includes('FX')) {
      keywords.add('fx luminaire');
      keywords.add('fxl');
    }
  }

  // Add part number/SKU
  if (product.SKU) {
    keywords.add(product.SKU.toLowerCase());
  }

  // Add UPC/GTIN
  if (product['GTIN, UPC, EAN, or ISBN']) {
    keywords.add(product['GTIN, UPC, EAN, or ISBN']);
  }

  // Add tags from Tags column
  if (product.Tags) {
    const tags = product.Tags.split(',').map(t => t.trim().toLowerCase());
    tags.forEach(tag => {
      if (tag) keywords.add(tag);
    });
  }

  // Add product type
  const productType = extractProductType(product.Name, product.Categories);
  keywords.add(productType.toLowerCase());

  // Add key features
  const keyFeature = extractKeyFeature(product['Short description'], product.Name);
  if (keyFeature) {
    keywords.add(keyFeature.toLowerCase());
  }

  // Add category keywords
  if (product.Categories) {
    const categories = product.Categories.split('>').map(c => c.trim().toLowerCase());
    categories.forEach(cat => {
      if (cat && cat.length > 2) {
        keywords.add(cat);
      }
    });
  }

  // Remove duplicates and return comma-separated
  return Array.from(keywords).filter(k => k.length > 0).join(', ');
}

/**
 * Generate slug from product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate language-specific slug
 */
export function generateLanguageSlug(name: string, languageCode: string): string {
  // For now, use same slug generation
  // In future, could use translation service to generate proper slugs
  return generateSlug(name);
}



