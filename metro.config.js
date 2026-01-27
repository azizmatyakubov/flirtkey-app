// Metro configuration for React Native
// https://reactnative.dev/docs/metro

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Performance optimizations
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// File resolution optimizations
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts.filter((ext) => ext !== 'svg'),
    'db',
    'sqlite',
  ],
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
