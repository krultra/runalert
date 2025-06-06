import type { NextConfig } from 'next';

// Instead of using next-transpile-modules, go back to a simpler next config with both CSS and node: protocol fixes
const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    // Don't modify server side webpack config
    if (!isServer) {
      // 1. Provide fallbacks for Node.js core modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        os: false,
        path: false,
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        process: require.resolve('process/browser'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        url: require.resolve('url/'),
        assert: require.resolve('assert/'),
        events: require.resolve('events/'),
      };

      // 2. Handle node: protocol imports directly with aliases
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:process': require.resolve('process/browser'),
        'node:buffer': require.resolve('buffer/'),
        'node:util': require.resolve('util/'),
        'node:url': require.resolve('url/'),
        'node:stream': require.resolve('stream-browserify'),
        'node:events': require.resolve('events/'),
        'node:crypto': require.resolve('crypto-browserify'),
        'node:http': require.resolve('stream-http'),
        'node:https': require.resolve('https-browserify'),
        'node:zlib': require.resolve('browserify-zlib'),
        'node:assert': require.resolve('assert/'),
        'node:os': require.resolve('os-browserify/browser'),
        'node:path': require.resolve('path-browserify'),
      };
      
      // 3. Add necessary plugins to inject global objects
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // 4. Important: Make sure not to mess with the CSS rules
      // Don't modify the module rules for CSS, keep Next.js defaults
    }
    
    return config;
  },
  
  // Production settings
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  } : {})
};

export default nextConfig;
