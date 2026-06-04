/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',     // slim Docker runtime image
  transpilePackages: ['@ananta/config', '@ananta/types'],
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.ananta.app' },
    ],
  },
};

export default nextConfig;
