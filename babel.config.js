module.exports = function (api) {
  const platform = api.caller((caller) => caller?.platform);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...(platform === "web" ? ["react-native-web"] : []),
      "nativewind/babel",
    ],
  };
};
