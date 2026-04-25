const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Apply NativeWind first, then layer SVG transformer on top
const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

const { transformer, resolver } = nativeWindConfig;

nativeWindConfig.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
nativeWindConfig.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
};

module.exports = nativeWindConfig;
