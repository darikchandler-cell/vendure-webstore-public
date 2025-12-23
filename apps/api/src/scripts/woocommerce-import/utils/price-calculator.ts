/**
 * Price Calculation Utilities
 * Adjusts prices by percentage and rounds to nearest cent
 */

/**
 * Adjust price by percentage and round to nearest cent
 * @param originalPrice Original price in dollars
 * @param percentageIncrease Percentage to increase (default 5%)
 * @returns Adjusted price in cents (for Vendure)
 */
export function adjustPrice(
  originalPrice: number,
  percentageIncrease: number = 5
): number {
  if (!originalPrice || originalPrice <= 0) {
    return 0;
  }

  // Increase by percentage
  const adjusted = originalPrice * (1 + percentageIncrease / 100);

  // Round to nearest cent
  const rounded = Math.round(adjusted * 100) / 100;

  // Convert to cents for Vendure
  return Math.round(rounded * 100);
}

/**
 * Adjust price and return as dollar amount (for display)
 */
export function adjustPriceInDollars(
  originalPrice: number,
  percentageIncrease: number = 5
): number {
  if (!originalPrice || originalPrice <= 0) {
    return 0;
  }

  // Increase by percentage
  const adjusted = originalPrice * (1 + percentageIncrease / 100);

  // Round to nearest cent
  return Math.round(adjusted * 100) / 100;
}

/**
 * Parse price from CSV string (handles various formats)
 */
export function parsePrice(priceString: string): number {
  if (!priceString || priceString.trim() === '') {
    return 0;
  }

  // Remove currency symbols and commas
  const cleaned = priceString
    .replace(/[$,\s]/g, '')
    .trim();

  const price = parseFloat(cleaned);

  if (isNaN(price) || price < 0) {
    return 0;
  }

  return price;
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number, currency: string = 'USD'): string {
  const priceInDollars = priceInCents / 100;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceInDollars);
}

/**
 * Calculate both regular and sale prices
 */
export function calculatePrices(
  regularPriceString: string,
  salePriceString?: string,
  percentageIncrease: number = 5
): { regularPrice: number; salePrice?: number } {
  const regularPrice = parsePrice(regularPriceString);
  const adjustedRegular = adjustPrice(regularPrice, percentageIncrease);

  let adjustedSale: number | undefined;
  if (salePriceString) {
    const salePrice = parsePrice(salePriceString);
    if (salePrice > 0 && salePrice < regularPrice) {
      adjustedSale = adjustPrice(salePrice, percentageIncrease);
    }
  }

  return {
    regularPrice: adjustedRegular,
    salePrice: adjustedSale,
  };
}

