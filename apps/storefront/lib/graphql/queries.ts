import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        name
        slug
        description
        shortDescription
        metaTitle
        metaDescription
        keywords
        featuredAsset {
          id
          preview
        }
        brand {
          id
          name
          slug
          logoAssetId
        }
        variants {
          id
          name
          price
          priceWithTax
          currencyCode
          sku
          weight
          length
          width
          height
          customStockStatus
          upc
        }
      }
      totalItems
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      shortDescription
      metaTitle
      metaDescription
      keywords
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
      brand {
        id
        name
        slug
        description
        logoAssetId
        websiteUrl
      }
      variants {
        id
        name
        price
        priceWithTax
        currencyCode
        sku
        weight
        length
        width
        height
        customStockStatus
        upc
      }
      facetValues {
        facet {
          name
        }
        name
      }
    }
  }
`;

export const GET_COLLECTIONS = gql`
  query GetCollections {
    collections {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
        }
      }
    }
  }
`;

export const GET_COLLECTION_BY_SLUG = gql`
  query GetCollectionBySlug($slug: String!) {
    collection(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      productVariants {
        items {
          id
          name
          price
          priceWithTax
          currencyCode
          product {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
          }
        }
      }
    }
  }
`;

