/** @type {import('next').NextConfig} */

// Derive the Supabase storage hostname from the environment variable at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: 'https', hostname: supabaseHostname }]
        : [{ protocol: 'https', hostname: '*.supabase.co' }]),
    ],
    // Cache optimized images for 1 hour minimum
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
