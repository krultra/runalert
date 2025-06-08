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

module.exports = nextConfig;
