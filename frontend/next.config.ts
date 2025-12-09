import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', 
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Forensics service needs /api/v1 prefix preserved (Nginx routes /api/v1/forensics/* to forensics:8001)
      {
        source: '/api/v1/forensics/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/forensics/:path*`
          : 'https://api.thaiscam.zcr.ai/api/v1/forensics/:path*',
      },
      // General API routes (adds /v1 prefix)
      {
        source: '/api/:path((?!auth|v1).*)',
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
