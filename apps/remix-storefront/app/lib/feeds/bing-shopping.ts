/**
 * Bing Shopping Feed Utilities
 */

export interface BingShoppingProduct {
  SKU: string;
  ProductName: string;
  ProductDescription: string;
  ProductURL: string;
  ImageURL: string;
  Price: string;
  Currency: string;
  Availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  Brand: string;
  MPN?: string;
  GTIN?: string;
  Category: string;
}

export function mapProductToBingShopping(
  product: any,
  variant: any,
  baseUrl: string,
  channel: 'us' | 'ca' = 'us'
): BingShoppingProduct {
  const currency = channel === 'us' ? 'USD' : 'CAD';
  const price = (variant.priceWithTax / 100).toFixed(2);
  const stockLevel = variant.stockLevel || 'OUT_OF_STOCK';
  
  const availability = 
    stockLevel === 'IN_STOCK' ? 'InStock' :
    stockLevel === 'OUT_OF_STOCK' ? 'OutOfStock' :
    'PreOrder';

  const brandName = product.facetValues?.find((fv: any) => fv.facet.code === 'brand')?.name || '';

  const categoryPath = product.collections
    ?.map((c: any) => c.name)
    .join(' > ') || '';

  return {
    SKU: variant.sku || variant.id,
    ProductName: product.name,
    ProductDescription: (product.description || product.name)
      .replace(/<[^>]*>/g, '')
      .substring(0, 5000)
      .trim(),
    ProductURL: `${baseUrl}/products/${product.slug}`,
    ImageURL: product.featuredAsset?.preview || '',
    Price: price,
    Currency: currency,
    Availability: availability,
    Brand: brandName,
    MPN: variant.sku,
    GTIN: variant.customFields?.upc,
    Category: categoryPath,
  };
}

export function generateBingShoppingFeed(
  products: BingShoppingProduct[],
  channel: 'us' | 'ca' = 'us'
): string {
  const channelName = channel === 'us' ? 'US' : 'CA';
  
  const items = products.map(product => {
    let item = `    <Product>
      <SKU>${escapeXml(product.SKU)}</SKU>
      <ProductName>${escapeXml(product.ProductName)}</ProductName>
      <ProductDescription>${escapeXml(product.ProductDescription)}</ProductDescription>
      <ProductURL>${escapeXml(product.ProductURL)}</ProductURL>
      <ImageURL>${escapeXml(product.ImageURL)}</ImageURL>
      <Price>${escapeXml(product.Price)}</Price>
      <Currency>${product.Currency}</Currency>
      <Availability>${product.Availability}</Availability>
      <Brand>${escapeXml(product.Brand)}</Brand>`;

    if (product.MPN) {
      item += `\n      <MPN>${escapeXml(product.MPN)}</MPN>`;
    }

    if (product.GTIN) {
      item += `\n      <GTIN>${escapeXml(product.GTIN)}</GTIN>`;
    }

    if (product.Category) {
      item += `\n      <Category>${escapeXml(product.Category)}</Category>`;
    }

    item += `\n    </Product>`;
    return item;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Products xmlns="http://schemas.microsoft.com/ado/2007/08/dataservices">
  <FeedInfo>
    <FeedName>Hunter Irrigation Supply - ${channelName} Products</FeedName>
    <FeedURL>https://hunterirrigationsupply.com</FeedURL>
    <FeedDescription>Professional irrigation and lighting products</FeedDescription>
  </FeedInfo>
${items}
</Products>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

