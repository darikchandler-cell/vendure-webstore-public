import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);

  return {
    title: {
      default: channel.name,
      template: `%s | ${channel.name}`,
    },
    description: 'Professional irrigation systems and components for residential and commercial use.',
    metadataBase: new URL(`https://${channel.domain}`),
    openGraph: {
      type: 'website',
      locale: channel.code === 'ca' ? 'en_CA' : 'en_US',
      url: `https://${channel.domain}`,
      siteName: channel.name,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

