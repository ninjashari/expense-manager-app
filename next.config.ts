/**
 * Next.js Configuration File
 * 
 * This file contains optimized configuration settings for the Expense Manager application.
 * It includes performance optimizations, security headers, and build configurations
 * following industry best practices for production deployment.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance Optimizations
  experimental: {
    // Enable optimized package imports for better tree shaking
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
    // Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Bundle analyzer (enable with ANALYZE=true)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        }))()
      );
      return config;
    },
  }),

  // Output configuration for better caching
  generateEtags: false,
  poweredByHeader: false,

  // Compression
  compress: true,

  // Strict mode for better development experience
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if type errors
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't run ESLint during builds (run separately in CI/CD)
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
