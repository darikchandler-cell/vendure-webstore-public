/**
 * HTML Cleaning Utility
 * Removes WordPress-specific markup and converts to clean markdown
 */

/**
 * Remove HTML tags but preserve structure
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';

  // Remove script and style tags completely
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Convert common HTML elements to markdown-like structure
  cleaned = cleaned
    // Convert headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    // Convert paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert lists
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Convert strong/bold
    .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**')
    // Convert emphasis/italic
    .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*')
    // Convert links (preserve URLs)
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Convert images (preserve alt text and src)
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '![]($1)')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Remove WordPress-specific classes and divs
 */
export function removeWordPressMarkup(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // Remove powered-by banners and warning banners
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*powered-by[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*warning[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

  // Remove WordPress-specific classes
  cleaned = cleaned.replace(/\s*class=["'][^"']*wp-[^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s*class=["'][^"']*woodmart[^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s*class=["'][^"']*field[^"']*["']/gi, '');

  // Remove empty divs
  cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '');

  // Remove data attributes
  cleaned = cleaned.replace(/\s*data-[^=]*=["'][^"']*["']/gi, '');

  return cleaned;
}

/**
 * Clean HTML and convert to markdown
 */
export function cleanHtmlToMarkdown(html: string): string {
  if (!html) return '';

  // First remove WordPress-specific markup
  let cleaned = removeWordPressMarkup(html);

  // Then strip HTML tags and convert to markdown
  cleaned = stripHtmlTags(cleaned);

  return cleaned;
}

/**
 * Clean short description (single paragraph, no HTML)
 */
export function cleanShortDescription(html: string): string {
  if (!html) return '';

  // Remove all HTML
  let cleaned = stripHtmlTags(html);

  // Take first sentence or first 200 characters
  const sentences = cleaned.split(/[.!?]/);
  if (sentences[0] && sentences[0].length < 200) {
    cleaned = sentences[0].trim();
    if (!cleaned.endsWith('.')) {
      cleaned += '.';
    }
  } else {
    cleaned = cleaned.substring(0, 200).trim();
    if (cleaned.length === 200) {
      cleaned += '...';
    }
  }

  return cleaned;
}

/**
 * Preserve manufacturer links while cleaning
 */
export function preserveManufacturerLinks(html: string): string {
  if (!html) return '';

  // Find and preserve links to manufacturer sites
  const manufacturerDomains = [
    'hunterirrigation.com',
    'hunterindustries.com',
    'fxl.com',
    'fxluminaire.com',
    'hydrawise.com',
  ];

  let cleaned = html;
  const linkMap = new Map<string, string>();

  // Extract manufacturer links
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  let linkIndex = 0;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const text = match[2];

    // Check if it's a manufacturer link
    const isManufacturerLink = manufacturerDomains.some(domain => url.includes(domain));

    if (isManufacturerLink) {
      const placeholder = `__MANUFACTURER_LINK_${linkIndex}__`;
      linkMap.set(placeholder, `[${text}](${url})`);
      cleaned = cleaned.replace(match[0], placeholder);
      linkIndex++;
    }
  }

  // Clean the HTML
  cleaned = cleanHtmlToMarkdown(cleaned);

  // Restore manufacturer links
  linkMap.forEach((link, placeholder) => {
    cleaned = cleaned.replace(placeholder, link);
  });

  return cleaned;
}

/**
 * Extract use cases from description
 */
export function extractUseCases(description: string): string[] {
  if (!description) return [];

  const useCases: string[] = [];
  const cleanDesc = stripHtmlTags(description).toLowerCase();

  // Look for use case patterns
  const patterns = [
    /(?:for|used for|ideal for|perfect for|designed for)\s+([^.!?]+)/gi,
    /(?:applications?|use cases?)[:;]\s*([^.!?]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(cleanDesc)) !== null) {
      const useCase = match[1].trim();
      if (useCase.length > 10 && useCase.length < 100) {
        useCases.push(useCase.charAt(0).toUpperCase() + useCase.slice(1));
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(useCases));
}

/**
 * Extract compatibility information
 */
export function extractCompatibility(description: string): string[] {
  if (!description) return [];

  const compatibility: string[] = [];
  const cleanDesc = stripHtmlTags(description);

  // Look for compatibility patterns
  const patterns = [
    /compatible with[:\s]+([^.!?]+)/gi,
    /works with[:\s]+([^.!?]+)/gi,
    /for use with[:\s]+([^.!?]+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(cleanDesc)) !== null) {
      const compat = match[1].trim();
      // Split by common separators
      const items = compat.split(/[,;]|and|or/).map(item => item.trim()).filter(item => item.length > 0);
      compatibility.push(...items);
    }
  }

  // Clean up and remove duplicates
  return Array.from(new Set(compatibility.map(c => c.replace(/^[^\w]+|[^\w]+$/g, '')))).filter(c => c.length > 0);
}


