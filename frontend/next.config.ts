import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', 
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'https://api.thaiscam.zcr.ai/v1/:path*',
      },
  // Admin API fallback if needed
      {
         source: '/admin-api/:path*',
         destination: 'https://api.thaiscam.zcr.ai/v1/admin/:path*'
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
