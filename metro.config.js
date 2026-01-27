// Metro configuration for React Native
// https://reactnative.dev/docs/metro

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  // Enable inline requires for faster startup
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // Minification settings
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    compress: {
      // Remove console.log in production
      drop_console: process.env.NODE_ENV === 'production',
    },
  },
};

// File resolution optimizations
config.resolver = {
  ...config.resolver,
  // Asset extensions for faster resolution
  assetExts: [
    ...config.resolver.assetExts.filter((ext) => ext !== 'svg'),
    'db',
    'sqlite',
  ],
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  // Reduce the number of files to check
  blockList: [
    ...Array.from(config.resolver.blockList || []),
    /\.git\/.*/,
    /node_modules\/.*\/node_modules\/.*/,
  ],
};

// Server optimizations
config.server = {
  ...config.server,
  // Enhance error messages
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add timing headers for debugging
      res.setHeader('X-Metro-Bundler', 'FlirtKey');
      return middleware(req, res, next);
    };
  },
};

// Caching optimizations
config.cacheStores = config.cacheStores || [];

module.exports = config;
