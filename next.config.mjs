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
  // Configure site icons (favicons)
  icons: {
    iconSizes: ['16x16', '32x32', '48x48', '64x64', '128x128', '256x256'],
    iconUrls: [
      '/favicon.ico',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/favicon-48x48.png',
    ],
  },
};

export default nextConfig;
