const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Make sure 'require' is properly handled
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    extraNodeModules: {
      // Add any module aliases if needed
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
