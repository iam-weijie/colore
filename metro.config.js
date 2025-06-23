const { getDefaultConfig } = require('@expo/metro-config');
const path = require("path");

const config = getDefaultConfig(__dirname);

// Fix assetExts and sourceExts before overriding resolver
const { assetExts, sourceExts } = config.resolver;

// Update transformer to use SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

// Extend resolver without overwriting previous settings
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter(ext => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    crypto: require.resolve("react-native-crypto"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer/"),
  },
};

module.exports = config;
