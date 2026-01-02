import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
        hostname: 'cf.bstatic.com',
      },
    ],
  },
};

export default nextConfig;
