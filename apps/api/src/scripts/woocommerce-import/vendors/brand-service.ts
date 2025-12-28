/**
 * Brand Service for Import
 * Creates or finds Brand entities
 */

import { RequestContext } from '@vendure/core';
import { BrandService as VendureBrandService } from '../../../plugins/product-enhancements/brand.service';

export class ImportBrandService {
  constructor(private brandService: VendureBrandService) {}

  /**
   * Create or find brand by name
   */
  async createOrFindBrand(
    ctx: RequestContext,
    brandName: string,
    websiteUrl?: string
  ): Promise<string | null> {
    if (!brandName || brandName.trim() === '') {
      return null;
    }

    // Normalize brand name
    const normalizedName = this.normalizeBrandName(brandName);

    // Try to find existing brand by slug
    const slug = this.slugify(normalizedName);
    const existing = await this.brandService.findBySlug(ctx, slug);

    if (existing) {
      return existing.id;
    }

    // Create new brand
    try {
      const brand = await this.brandService.create(ctx, {
        name: normalizedName,
        slug,
        websiteUrl: websiteUrl || this.getDefaultWebsiteUrl(normalizedName),
      });

      return brand.id;
    } catch (error) {
      console.error(`Error creating brand ${normalizedName}:`, error);
      return null;
    }
  }

  /**
   * Normalize brand name
   */
  private normalizeBrandName(name: string): string {
    const normalized = name.trim();

    // Map common variations
    const brandMap: Record<string, string> = {
      'hunter': 'Hunter Irrigation',
      'hunter industries': 'Hunter Irrigation',
      'hunter irrigation': 'Hunter Irrigation',
      'fx luminaire': 'FX Luminaire',
      'fxl': 'FX Luminaire',
      'fx luminaire inc': 'FX Luminaire',
    };

    const lower = normalized.toLowerCase();
    return brandMap[lower] || normalized;
  }

  /**
   * Get default website URL for brand
   */
  private getDefaultWebsiteUrl(brandName: string): string | undefined {
    const lower = brandName.toLowerCase();

    if (lower.includes('hunter')) {
      return 'https://www.hunterirrigation.com';
    }
    if (lower.includes('fx') || lower.includes('luminaire')) {
      return 'https://www.fxl.com';
    }

    return undefined;
  }

  /**
   * Slugify brand name
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}



