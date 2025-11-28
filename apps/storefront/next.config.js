/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'hunterirrigationsupply.com',
      'www.hunterirrigationsupply.com',
      'hunterirrigation.ca',
      'www.hunterirrigation.ca',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.**.amazonaws.com',
      },
    ],
  },
  // Enable compression
  compress: true,
  // Output standalone for Docker
  output: 'standalone',
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure proper static file serving
  trailingSlash: false,
  // Power by header
  poweredByHeader: false,
  // React strict mode (helps catch hydration issues)
  reactStrictMode: true,
};

module.exports = nextConfig;

