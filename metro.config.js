const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...(config.resolver || {}),
  unstable_enablePackageExports: true,
  assetExts: [...config.resolver.assetExts, "ttf", "otf", "woff", "woff2"],
};

config.transformer = {
  ...(config.transformer || {}),
  unstable_allowRequireContext: true,
};

module.exports = withNativeWind(config, { input: "./global.css" });
