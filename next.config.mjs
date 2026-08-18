/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bnbscflfrnwuigouxxfc.supabase.co',
      },
    ],
    // Cache optimized images for 1 hour minimum
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
