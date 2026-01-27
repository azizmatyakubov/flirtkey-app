module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { worklets: true }]],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/types': './src/types',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
          },
        },
      ],
    ],
  };
};
