/**
 * FAQ Schema Generator
 * Creates FAQPage schema for products to help with AI search engines
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQ schema for a product
 */
export function generateFAQSchema(faqs: FAQItem[]): object {
  if (!faqs || faqs.length === 0) {
    return {};
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate default FAQs for a product based on product data
 */
export function generateDefaultFAQs(product: {
  name: string;
  sku?: string;
  brand?: string;
  description?: string;
  compatibility?: string[];
  useCase?: string[];
}): FAQItem[] {
  const faqs: FAQItem[] = [];

  // What is [product]?
  if (product.name && product.description) {
    const shortDesc = product.description
      .replace(/<[^>]*>/g, '')
      .substring(0, 200)
      .trim();
    faqs.push({
      question: `What is ${product.name}?`,
      answer: `${product.name}${product.brand ? ` from ${product.brand}` : ''} is ${shortDesc}${shortDesc.endsWith('.') ? '' : '.'}`,
    });
  }

  // What is [SKU] used for?
  if (product.sku && product.useCase && product.useCase.length > 0) {
    faqs.push({
      question: `What is ${product.sku} used for?`,
      answer: `The ${product.sku} is used for ${product.useCase.join(', ')}.`,
    });
  }

  // Compatibility questions
  if (product.compatibility && product.compatibility.length > 0) {
    faqs.push({
      question: `What is ${product.sku || product.name} compatible with?`,
      answer: `${product.sku || product.name} is compatible with ${product.compatibility.join(', ')}.`,
    });
  }

  // Where can I buy [product]?
  faqs.push({
    question: `Where can I buy ${product.name}?`,
    answer: `${product.name} is available for purchase at Hunter Irrigation Supply. Check current pricing and availability on our website.`,
  });

  return faqs;
}


