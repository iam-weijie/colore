const { getDefaultConfig } = require('@expo/metro-config');
const path = require("path");

const config = getDefaultConfig(__dirname);

// Destructure existing resolver parts
const { assetExts, sourceExts } = config.resolver;

// Extend transformer to handle SVG
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

// Rebuild the resolver with custom asset/sourceExts, extra modules, and alias
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
  alias: {
    ...(config.resolver.alias || {}),
    tslib: path.resolve(__dirname, "node_modules/tslib/tslib.es6.js"),
  },
};

module.exports = config;
