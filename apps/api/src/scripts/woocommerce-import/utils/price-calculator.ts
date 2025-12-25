/**
 * Price Calculation Utilities
 * Adjusts prices by percentage and rounds up to nearest 0.10 (tenth)
 */

/**
 * Round up to nearest 0.10 (tenth)
 * @param priceInDollars Price in dollars
 * @returns Price rounded up to nearest 0.10 in dollars
 */
function roundUpToNearestTenth(priceInDollars: number): number {
  return Math.ceil(priceInDollars * 10) / 10;
}

/**
 * Round up price in cents to nearest 0.10 (tenth)
 * @param priceInCents Price in cents
 * @returns Price rounded up to nearest 0.10 in cents
 */
export function roundUpPriceToNearestTenth(priceInCents: number): number {
  if (!priceInCents || priceInCents <= 0) {
    return 0;
  }
  const priceInDollars = priceInCents / 100;
  const rounded = roundUpToNearestTenth(priceInDollars);
  return Math.round(rounded * 100);
}

/**
 * Adjust price by percentage and round up to nearest 0.10 (tenth)
 * @param originalPrice Original price in dollars
 * @param percentageIncrease Percentage to increase (default 5%)
 * @returns Adjusted price in cents (for Vendure), rounded up to nearest 0.10
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

  // Round up to nearest 0.10 (tenth)
  const rounded = roundUpToNearestTenth(adjusted);

  // Convert to cents for Vendure
  return Math.round(rounded * 100);
}

/**
 * Adjust price and return as dollar amount (for display)
 * Rounds up to nearest 0.10 (tenth)
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

  // Round up to nearest 0.10 (tenth)
  return roundUpToNearestTenth(adjusted);
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

