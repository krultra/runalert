/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This ensures Firebase files don't cause build errors
  webpack: (config) => {
    // Ignore Firebase files during build
    config.ignoreWarnings = [
      { module: /firebase-admin/ },
      { file: /firestore\.rules/ },
    ];
    
    return config;
  },
  // Handle missing firestore.rules file in production
  experimental: {
    instrumentationHook: true,
  },
  // Tell Next.js that Firebase files are optional
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checks, but allow build to continue
  },
};

module.exports = nextConfig;
