'use client';

import { ApolloProvider } from '@apollo/client';
import { createApolloClient } from '@/lib/apollo-client';
import { detectChannel } from '@/lib/channel';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [channelCode, setChannelCode] = useState<'us' | 'ca'>('us');
  const [client, setClient] = useState(() => createApolloClient('us'));

  useEffect(() => {
    // Detect channel on client side
    const hostname = window.location.hostname;
    const detected = detectChannel(hostname);
    setChannelCode(detected);
    setClient(createApolloClient(detected));
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

