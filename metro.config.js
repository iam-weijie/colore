const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Add custom resolver for crypto polyfills
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    'crypto': require.resolve('react-native-crypto'),
    'stream': require.resolve('stream-browserify'),
    'buffer': require.resolve('buffer/'),
  },
};

module.exports = config;
