import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['mission.homepop.fr'],
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
