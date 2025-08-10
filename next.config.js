/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude test files and debugging files from the build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map((extension) => {
    return extension
  }),
  
  webpack: (config, { isServer }) => {
    // Exclude test files from webpack compilation
    config.module.rules.push({
      test: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
      loader: 'ignore-loader'
    })
    
    return config
  },
}

module.exports = nextConfig