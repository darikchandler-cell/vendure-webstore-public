/**
 * Tax Rate API Service
 * Integrates with public tax rate APIs to fetch live or annual tax rates
 * Supports: SalesTaxAPI, Ziptax, Tax Data API
 */

import { RequestContext, TaxRateService, ZoneService, TransactionalConnection } from '@vendure/core';

export interface TaxRateApiConfig {
  provider: 'salestaxapi' | 'ziptax' | 'taxdata' | 'zip2tax';
  apiKey: string;
  useLiveRates?: boolean; // true for live, false for annual snapshot
  cacheDuration?: number; // Cache duration in milliseconds (default: 24 hours for live, 1 year for annual)
}

export interface TaxRateResponse {
  rate: number; // Tax rate as percentage (e.g., 8.5 for 8.5%)
  jurisdiction: string;
  state?: string;
  county?: string;
  city?: string;
  zipCode?: string;
  effectiveDate?: string;
}

export class TaxRateApiService {
  private cache = new Map<string, { rate: number; expiresAt: number }>();

  constructor(
    private taxRateService: TaxRateService,
    private zoneService: ZoneService,
    private connection: TransactionalConnection
  ) {}

  /**
   * Fetch tax rate from SalesTaxAPI
   */
  async fetchFromSalesTaxAPI(
    zipCode: string,
    config: TaxRateApiConfig
  ): Promise<TaxRateResponse> {
    const cacheKey = `salestaxapi-${zipCode}`;
    const cached = this.getCachedRate(cacheKey, config);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://api.salestaxapi.io/v1/rate?zip=${zipCode}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`SalesTaxAPI error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const rate = parseFloat(data.rate || '0') * 100; // Convert to percentage

      const result: TaxRateResponse = {
        rate,
        jurisdiction: data.jurisdiction || zipCode,
        state: data.state,
        county: data.county,
        city: data.city,
        zipCode,
        effectiveDate: data.effective_date,
      };

      this.cacheRate(cacheKey, result.rate, config);
      return result;
    } catch (error) {
      console.error('Error fetching from SalesTaxAPI:', error);
      throw error;
    }
  }

  /**
   * Fetch tax rate from Ziptax
   */
  async fetchFromZiptax(
    zipCode: string,
    config: TaxRateApiConfig
  ): Promise<TaxRateResponse> {
    const cacheKey = `ziptax-${zipCode}`;
    const cached = this.getCachedRate(cacheKey, config);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://api.zip.tax/v1/rate?zip=${zipCode}`,
        {
          headers: {
            'X-API-Key': config.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ziptax error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const rate = parseFloat(data.tax_rate || '0') * 100;

      const result: TaxRateResponse = {
        rate,
        jurisdiction: data.jurisdiction || zipCode,
        state: data.state,
        county: data.county,
        city: data.city,
        zipCode,
        effectiveDate: data.effective_date,
      };

      this.cacheRate(cacheKey, result.rate, config);
      return result;
    } catch (error) {
      console.error('Error fetching from Ziptax:', error);
      throw error;
    }
  }

  /**
   * Fetch tax rate from Tax Data API
   */
  async fetchFromTaxData(
    countryCode: string,
    stateCode?: string,
    config?: TaxRateApiConfig
  ): Promise<TaxRateResponse> {
    const cacheKey = `taxdata-${countryCode}-${stateCode || ''}`;
    if (config) {
      const cached = this.getCachedRate(cacheKey, config);
      if (cached) return cached;
    }

    try {
      let url = `https://api.taxdata.io/v1/rate?country=${countryCode}`;
      if (stateCode) {
        url += `&state=${stateCode}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config?.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Tax Data API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const rate = parseFloat(data.rate || '0') * 100;

      const result: TaxRateResponse = {
        rate,
        jurisdiction: data.jurisdiction || countryCode,
        state: stateCode,
        zipCode: data.zip_code,
        effectiveDate: data.effective_date,
      };

      if (config) {
        this.cacheRate(cacheKey, result.rate, config);
      }
      return result;
    } catch (error) {
      console.error('Error fetching from Tax Data API:', error);
      throw error;
    }
  }

  /**
   * Get Canadian tax rates (GST/HST/PST)
   * Canada has fixed rates by province, so we can use a lookup table
   */
  async getCanadianTaxRate(provinceCode: string): Promise<TaxRateResponse> {
    // Canadian tax rates (2024-2025)
    const canadianRates: Record<string, { gst: number; hst: number; pst: number }> = {
      'AB': { gst: 5, hst: 0, pst: 0 }, // Alberta: 5% GST
      'BC': { gst: 5, hst: 0, pst: 7 }, // British Columbia: 5% GST + 7% PST
      'MB': { gst: 5, hst: 0, pst: 7 }, // Manitoba: 5% GST + 7% PST
      'NB': { gst: 0, hst: 15, pst: 0 }, // New Brunswick: 15% HST
      'NL': { gst: 0, hst: 15, pst: 0 }, // Newfoundland and Labrador: 15% HST
      'NS': { gst: 0, hst: 15, pst: 0 }, // Nova Scotia: 15% HST
      'NT': { gst: 5, hst: 0, pst: 0 }, // Northwest Territories: 5% GST
      'NU': { gst: 5, hst: 0, pst: 0 }, // Nunavut: 5% GST
      'ON': { gst: 0, hst: 13, pst: 0 }, // Ontario: 13% HST
      'PE': { gst: 0, hst: 15, pst: 0 }, // Prince Edward Island: 15% HST
      'QC': { gst: 5, hst: 0, pst: 9.975 }, // Quebec: 5% GST + 9.975% QST
      'SK': { gst: 5, hst: 0, pst: 6 }, // Saskatchewan: 5% GST + 6% PST
      'YT': { gst: 5, hst: 0, pst: 0 }, // Yukon: 5% GST
    };

    const province = provinceCode.toUpperCase();
    const rates = canadianRates[province];

    if (!rates) {
      throw new Error(`Unknown Canadian province: ${provinceCode}`);
    }

    // Return combined rate (GST + HST + PST)
    const totalRate = rates.gst + rates.hst + rates.pst;

    return {
      rate: totalRate,
      jurisdiction: province,
      state: province,
      effectiveDate: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Create or update tax rate in Vendure
   */
  async createOrUpdateTaxRate(
    ctx: RequestContext,
    zoneId: string,
    name: string,
    rate: number,
    enabled: boolean = true
  ): Promise<string> {
    // Check if tax rate already exists
    const existingRates = await this.taxRateService.findAll(ctx);
    const existing = existingRates.items.find(
      (tr) => tr.name === name && tr.zone.id === zoneId
    );

    if (existing) {
      // Update existing rate
      const updated = await this.taxRateService.update(ctx, {
        id: existing.id,
        value: rate,
        enabled,
      });
      return String(updated.id);
    } else {
      // Create new rate
      const created = await this.taxRateService.create(ctx, {
        name,
        value: rate,
        enabled,
        zoneId,
        categoryId: '1', // Default tax category
      });
      return String(created.id);
    }
  }

  /**
   * Sync tax rates for a zone from API
   */
  async syncTaxRatesForZone(
    ctx: RequestContext,
    zoneId: string,
    zoneName: string,
    config: TaxRateApiConfig,
    zipCodes?: string[]
  ): Promise<void> {
    if (zoneName === 'Canada' || zoneName.includes('Canada')) {
      // Handle Canadian provinces
      const provinces = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'NU', 'YT'];
      for (const province of provinces) {
        try {
          const taxData = await this.getCanadianTaxRate(province);
          await this.createOrUpdateTaxRate(
            ctx,
            zoneId,
            `CA ${province} Tax (${taxData.rate}%)`,
            taxData.rate
          );
        } catch (error) {
          console.error(`Error syncing tax rate for ${province}:`, error);
        }
      }
    } else if (zoneName === 'United States' || zoneName.includes('United States')) {
      // Handle US states - use default rates or fetch from API
      if (zipCodes && zipCodes.length > 0 && config.provider) {
        // Fetch rates for specific zip codes
        for (const zipCode of zipCodes.slice(0, 10)) { // Limit to 10 to avoid rate limits
          try {
            let taxData: TaxRateResponse;
            switch (config.provider) {
              case 'salestaxapi':
                taxData = await this.fetchFromSalesTaxAPI(zipCode, config);
                break;
              case 'ziptax':
                taxData = await this.fetchFromZiptax(zipCode, config);
                break;
              default:
                throw new Error(`Unsupported provider: ${config.provider}`);
            }

            await this.createOrUpdateTaxRate(
              ctx,
              zoneId,
              `US ${taxData.state || zipCode} Tax (${taxData.rate}%)`,
              taxData.rate
            );
          } catch (error) {
            console.error(`Error fetching tax rate for ${zipCode}:`, error);
          }
        }
      } else {
        // Use default US state rates (2024-2025)
        const defaultUSRates: Record<string, number> = {
          'AL': 4.0, 'AK': 0.0, 'AZ': 5.6, 'AR': 6.5, 'CA': 7.25,
          'CO': 2.9, 'CT': 6.35, 'DE': 0.0, 'FL': 6.0, 'GA': 4.0,
          'HI': 4.17, 'ID': 6.0, 'IL': 6.25, 'IN': 7.0, 'IA': 6.0,
          'KS': 6.5, 'KY': 6.0, 'LA': 4.45, 'ME': 5.5, 'MD': 6.0,
          'MA': 6.25, 'MI': 6.0, 'MN': 6.88, 'MS': 7.0, 'MO': 4.23,
          'MT': 0.0, 'NE': 5.5, 'NV': 6.85, 'NH': 0.0, 'NJ': 6.63,
          'NM': 5.13, 'NY': 4.0, 'NC': 4.75, 'ND': 5.0, 'OH': 5.75,
          'OK': 4.5, 'OR': 0.0, 'PA': 6.0, 'RI': 7.0, 'SC': 6.0,
          'SD': 4.5, 'TN': 7.0, 'TX': 6.25, 'UT': 6.1, 'VT': 6.0,
          'VA': 5.3, 'WA': 6.5, 'WV': 6.0, 'WI': 5.0, 'WY': 4.0,
          'DC': 6.0,
        };

        for (const [state, rate] of Object.entries(defaultUSRates)) {
          await this.createOrUpdateTaxRate(
            ctx,
            zoneId,
            `US ${state} Tax (${rate}%)`,
            rate
          );
        }
      }
    }
  }

  private getCachedRate(
    cacheKey: string,
    config: TaxRateApiConfig
  ): TaxRateResponse | null {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        rate: cached.rate,
        jurisdiction: cacheKey,
      };
    }
    return null;
  }

  private cacheRate(
    cacheKey: string,
    rate: number,
    config: TaxRateApiConfig
  ): void {
    const duration = config.cacheDuration || (
      config.useLiveRates
        ? 24 * 60 * 60 * 1000 // 24 hours for live rates
        : 365 * 24 * 60 * 60 * 1000 // 1 year for annual rates
    );

    this.cache.set(cacheKey, {
      rate,
      expiresAt: Date.now() + duration,
    });
  }
}

