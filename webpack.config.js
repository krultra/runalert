const webpack = require('webpack');

module.exports = (config, { isServer }) => {
  // Fixes npm packages that depend on `node:` protocol
  if (!isServer) {
    // Client-side only configuration
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // Node.js built-ins
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      dgram: false,
      module: false,
      // Polyfills
      process: require.resolve('process/browser'),
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      assert: require.resolve('assert/'),
      url: require.resolve('url/')
    };

    // Add polyfills
    config.plugins = [
      ...(config.plugins || []),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ];

    // Handle node: protocol
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:process': 'process/browser',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:assert': 'assert',
      'node:stream': 'stream-browserify',
      'node:path': 'path-browserify',
      'node:os': 'os-browserify/browser',
    };
  }

  return config;
};
