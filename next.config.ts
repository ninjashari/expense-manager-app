/**
 * @file next.config.ts
 * @description This file contains the configuration for the Next.js application.
 * It is used to customize the behavior of Next.js, such as setting up redirects,
 * defining environment variables, and configuring the build process.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

export default nextConfig;
