/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.test\.(ts|tsx)$/,
        loader: 'ignore-loader',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
