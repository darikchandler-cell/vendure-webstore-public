'use client';

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { detectChannel } from '@/lib/channel';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Always start with 'us' to prevent hydration mismatch
  // The channel will be detected and updated on the client side only
  const [channelCode, setChannelCode] = useState<'us' | 'ca'>('us');
  const [client, setClient] = useState(() => {
    try {
      return createApolloClient('us');
    } catch (error) {
      console.error('Failed to create initial Apollo Client:', error);
      throw error;
    }
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    try {
      // Detect channel on client side only after mount
      if (typeof window === 'undefined') {
        return;
      }

      const hostname = window.location?.hostname;
      if (!hostname) {
        return;
      }

      const detected = detectChannel(hostname);
      
      // Only update if channel changed
      if (detected !== channelCode) {
        setChannelCode(detected);
        try {
          const newClient = createApolloClient(detected);
          setClient(newClient);
        } catch (error) {
          console.error('Failed to create Apollo Client for channel:', detected, error);
        }
      }
    } catch (error) {
      console.error('Error in Providers useEffect:', error);
    }
  }, [isMounted, channelCode]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

