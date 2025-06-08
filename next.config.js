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
  // Tell Next.js that Firebase files are optional
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checks, but allow build to continue
  },
};

module.exports = nextConfig;
