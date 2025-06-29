/**
 * @file next.config.ts
 * @description This file contains the configuration for the Next.js application.
 * It is used to customize the behavior of Next.js, such as setting up redirects,
 * defining environment variables, and configuring the build process.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Exclude PostgreSQL-related modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        pg: false,
        'pg-native': false,
      };
      
      // Properly externalize server-only modules for client-side
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pg', 'pg-native', 'bcryptjs', 'jsonwebtoken');
      } else {
        config.externals = [
          config.externals,
          'pg',
          'pg-native', 
          'bcryptjs',
          'jsonwebtoken'
        ];
      }
    }

    config.ignoreWarnings = [
      {
        module: /node_modules\/pg/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /node_modules\/pg-connection-string/,
        message: /Module not found: Can't resolve 'fs'/,
      },
    ];
    
    return config;
  },
  
  // Ensure server-only modules are not bundled for client
  serverExternalPackages: ['pg', 'pg-native', 'bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
