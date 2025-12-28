/**
 * Google Merchant Center Feed Utilities
 */

export interface GoogleMerchantProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  price: string;
  brand: string;
  condition: 'new' | 'used' | 'refurbished';
  mpn?: string;
  gtin?: string;
  product_type?: string;
  google_product_category?: string;
  shipping?: {
    country: string;
    service: string;
    price: string;
  };
}

export function mapProductToGoogleMerchant(
  product: any,
  variant: any,
  baseUrl: string,
  channel: 'us' | 'ca' = 'us'
): GoogleMerchantProduct {
  const currency = channel === 'us' ? 'USD' : 'CAD';
  const price = (variant.priceWithTax / 100).toFixed(2);
  const stockLevel = variant.stockLevel || 'OUT_OF_STOCK';
  
  const availability = 
    stockLevel === 'IN_STOCK' ? 'in stock' :
    stockLevel === 'OUT_OF_STOCK' ? 'out of stock' :
    'preorder';

  const brandName = product.facetValues?.find((fv: any) => fv.facet.code === 'brand')?.name || '';

  const categoryPath = product.collections
    ?.map((c: any) => c.name)
    .join(' > ') || '';

  const googleCategory = mapToGoogleCategory(categoryPath);

  return {
    id: variant.sku || variant.id,
    title: product.name,
    description: (product.description || product.name)
      .replace(/<[^>]*>/g, '')
      .substring(0, 5000)
      .trim(),
    link: `${baseUrl}/products/${product.slug}`,
    image_link: product.featuredAsset?.preview || '',
    availability,
    price: `${price} ${currency}`,
    brand: brandName,
    condition: 'new',
    mpn: variant.sku,
    gtin: variant.customFields?.upc,
    product_type: categoryPath,
    google_product_category: googleCategory,
    shipping: {
      country: channel === 'us' ? 'US' : 'CA',
      service: 'Standard',
      price: `0 ${currency}`,
    },
  };
}

function mapToGoogleCategory(categoryPath: string): string {
  const path = categoryPath.toLowerCase();
  if (path.includes('irrigation')) return '1179';
  if (path.includes('lighting') || path.includes('luminaire')) return '532';
  return '1179';
}

export function generateGoogleMerchantFeed(
  products: GoogleMerchantProduct[],
  channel: 'us' | 'ca' = 'us'
): string {
  const channelName = channel === 'us' ? 'US' : 'CA';
  
  const items = products.map(product => {
    let item = `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.description)}</g:description>
      <g:link>${escapeXml(product.link)}</g:link>
      <g:image_link>${escapeXml(product.image_link)}</g:image_link>
      <g:availability>${product.availability}</g:availability>
      <g:price>${escapeXml(product.price)}</g:price>
      <g:brand>${escapeXml(product.brand)}</g:brand>
      <g:condition>${product.condition}</g:condition>`;

    if (product.mpn) {
      item += `\n      <g:mpn>${escapeXml(product.mpn)}</g:mpn>`;
    }

    if (product.gtin) {
      item += `\n      <g:gtin>${escapeXml(product.gtin)}</g:gtin>`;
    }

    if (product.product_type) {
      item += `\n      <g:product_type>${escapeXml(product.product_type)}</g:product_type>`;
    }

    if (product.google_product_category) {
      item += `\n      <g:google_product_category>${product.google_product_category}</g:google_product_category>`;
    }

    if (product.shipping) {
      item += `\n      <g:shipping>
        <g:country>${product.shipping.country}</g:country>
        <g:service>${product.shipping.service}</g:service>
        <g:price>${escapeXml(product.shipping.price)}</g:price>
      </g:shipping>`;
    }

    item += `\n    </item>`;
    return item;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Hunter Irrigation Supply - ${channelName} Products</title>
    <link>https://hunterirrigationsupply.com</link>
    <description>Professional irrigation and lighting products</description>
${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}



