'use client';

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { detectChannel } from '@/lib/channel';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [channelCode, setChannelCode] = useState<'us' | 'ca'>('us');
  const [client, setClient] = useState(() => {
    try {
      return createApolloClient('us');
    } catch (error) {
      console.error('Failed to create initial Apollo Client:', error);
      // If creation fails, try one more time with default
      try {
        return createApolloClient('us');
      } catch (fallbackError) {
        console.error('Fallback Apollo Client creation also failed:', fallbackError);
        // This should rarely happen, but if it does, we need to handle it
        // The error boundary will catch this if it causes a render error
        throw fallbackError;
      }
    }
  });

  useEffect(() => {
    try {
      // Detect channel on client side
      if (typeof window === 'undefined') {
        return; // Server-side, skip
      }

      const hostname = window.location?.hostname;
      if (!hostname) {
        console.warn('Unable to detect hostname, using default channel');
        return;
      }

      const detected = detectChannel(hostname);
      setChannelCode(detected);
      
      try {
        const newClient = createApolloClient(detected);
        setClient(newClient);
      } catch (error) {
        console.error('Failed to create Apollo Client for channel:', detected, error);
        // Keep existing client to prevent app crash
      }
    } catch (error) {
      console.error('Error in Providers useEffect:', error);
      // Don't throw - keep existing client to prevent app crash
    }
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

