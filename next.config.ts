import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.booking.com',
      },
      {
        protocol: 'https',
        hostname: '**.bstatic.com',
      },
    ],
  },
};

export default nextConfig;
