const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Define which URLs to exclude from PWA caching
  buildExcludes: [/middleware-manifest\.json$/],
  // Add additional manifests patterns to avoid precache errors
  publicExcludes: [
    '!noprecache/**/*'
  ],
  // Use our custom service worker instead of the generated one
  swSrc: 'public/sw.js',
  // Important for background processing
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-api-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sound-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Properly handle server-only modules
  webpack: (config, { isServer }) => {
    // Handle firebase-admin (server-only)
    if (!isServer) {
      // Don't bundle server-only modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        http2: false,
        dns: false,
        path: false,
        os: false,
      };
    }
    
    // Ignore Firebase files and warnings during build
    config.ignoreWarnings = [
      { module: /firebase-admin/ },
      { file: /firestore\.rules/ },
      { file: /firestore\.rules\.bak/ },
      // Also ignore PWA-related warnings
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ];
    
    return config;
  },
  // Ignore TypeScript and ESLint errors in production build
  typescript: {
    // This doesn't block production builds
    ignoreBuildErrors: true,
  },
  // Don't run ESLint during the build
  eslint: {
    // This doesn't block production builds
    ignoreDuringBuilds: true,
  },
};

// Export the configuration with PWA support
module.exports = withPWA(nextConfig);
