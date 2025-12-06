import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://172.233.71.162:8000/api/:path*', // Proxy to Linode Backend
      },
    ]
  },
};

export default nextConfig;
