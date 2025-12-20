import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getChannelConfig, type ChannelCode } from './channel';

const uri = (typeof window === 'undefined' && process.env.SERVER_API_URL)
    ? `${process.env.SERVER_API_URL}/shop-api`
    : (process.env.NEXT_PUBLIC_VENDURE_API_URL
      ? (process.env.NEXT_PUBLIC_VENDURE_API_URL.includes('shop-api') 
          ? process.env.NEXT_PUBLIC_VENDURE_API_URL 
          : `${process.env.NEXT_PUBLIC_VENDURE_API_URL}/shop-api`)
      : 'http://localhost:3000/shop-api');

if (typeof window === 'undefined') {
  console.log(`[Server] Apollo Client URI: ${uri}`);
  console.log(`[Server] SERVER_API_URL: ${process.env.SERVER_API_URL}`);
}

const httpLink = createHttpLink({
  uri,
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

  // Error handling link
  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        );
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
      
      // Handle 400 Bad Request specifically
      if ('statusCode' in networkError && networkError.statusCode === 400) {
        console.error('Bad Request (400) - Check channel token and API URL');
      }
    }
  });

  return new ApolloClient({
    link: from([authLink, errorLink, httpLink]),
    cache: new InMemoryCache({
      // Add error handling for cache
      typePolicies: {
        Query: {
          fields: {
            products: {
              merge(existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    }),
    ssrMode: typeof window === 'undefined',
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all', // Return both data and errors
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
}

