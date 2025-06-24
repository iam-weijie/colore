module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      [
        "module-resolver",
        {
          alias: {
            tslib: "./node_modules/tslib/tslib.es6.js",
          },
        },
      ],
    ],
  };
};
