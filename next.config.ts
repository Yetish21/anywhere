import type { NextConfig } from "next";

/**
 * Next.js configuration for the Anywhere application.
 * Configures image remote patterns for Google Maps domains and enables
 * Turbopack filesystem caching for faster development builds.
 */
const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com"
      }
    ]
  }
};

export default nextConfig;
