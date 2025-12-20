import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { getChannelFromHeaders } from '@/lib/channel';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

// Google Analytics tracking IDs
const GA_US_ID = 'G-BSL225PG0B';
const GA_CA_ID = 'G-9LK4JKHQSP';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const channel = getChannelFromHeaders(headersList);
  const gaId = channel.code === 'ca' ? GA_CA_ID : GA_US_ID;

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

