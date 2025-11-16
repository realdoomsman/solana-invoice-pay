/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore pino-pretty optional dependency
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pino-pretty': false,
      }
    }
    
    // Ignore optional dependencies that cause build warnings
    config.externals = config.externals || []
    config.externals.push({
      'pino-pretty': 'pino-pretty',
      'encoding': 'encoding',
    })
    
    return config
  },
}

module.exports = nextConfig
