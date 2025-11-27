import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getChannelConfig, type ChannelCode } from './channel';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_VENDURE_API_URL
    ? `${process.env.NEXT_PUBLIC_VENDURE_API_URL}/shop-api`
    : 'http://localhost:3000/shop-api',
});

/**
 * Create Apollo Client instance with channel token
 */
export function createApolloClient(channelCode: ChannelCode) {
  const channelConfig = getChannelConfig(channelCode);

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        'vendure-token': channelConfig.token,
      },
    };
  });

  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
    ssrMode: typeof window === 'undefined',
  });
}

