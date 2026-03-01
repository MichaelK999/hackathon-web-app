import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://aclo.ai/:path*',
      },
    ];
  },
};

export default nextConfig;
