import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone', // Removed for Vercel default handling
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://172.233.71.162:8000/api/:path*',
      },
  // Admin API fallback if needed
      {
         source: '/admin-api/:path*',
         destination: 'http://172.233.71.162:8000/api/v1/admin/:path*'
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
