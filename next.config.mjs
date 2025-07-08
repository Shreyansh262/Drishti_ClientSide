/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['ssh2']
  },
  // THIS IS THE CRUCIAL PART YOU NEED TO ADD/ENSURE IS PRESENT
  webpack: (config, { isServer }) => {
    // Only apply this for server-side builds (API routes, getServerSideProps, etc.)
    if (isServer) {
      // This rule tells Webpack how to handle .node files (native Node.js modules).
      // It uses 'node-loader' to load them directly, which is crucial for ssh2.
      config.module.rules.push({
        test: /\.node$/,
        loader: 'node-loader',
      });
      
      // Exclude problematic modules from bundling
      config.externals = config.externals || [];
      config.externals.push('ssh2');
    }

    // Always return the modified config
    return config;
  },
};

export default nextConfig; // Keep this line as it is for .mjs files