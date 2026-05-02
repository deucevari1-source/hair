/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Narrow these to actual image hosts you use (e.g. supabase / cloudinary / s3 bucket).
      // Leaving '**' open allows next/image to proxy any URL — SSRF-adjacent.
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
