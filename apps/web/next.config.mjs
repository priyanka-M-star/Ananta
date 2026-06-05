/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'standalone' bundles only what's needed for Docker — but the build step
  // creates symlinks, which Windows blocks unless Developer Mode is on.
  // So we only opt in when NEXT_OUTPUT=standalone (set in the Dockerfile).
  // Local Windows + Mac dev builds skip it; the production image still gets it.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
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
