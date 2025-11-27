import { MetadataRoute } from 'next';
import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';

export default function robots(): MetadataRoute.Robots {
  const headersList = headers();
  const channel = getChannelFromHeaders(headersList);
  const baseUrl = `https://${channel.domain}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

