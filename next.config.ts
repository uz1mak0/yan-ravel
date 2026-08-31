import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Add this line
  images: {
    unoptimized: true, // Required for static export if using next/image
  },
};

export default nextConfig;
