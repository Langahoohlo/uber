const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const emptyModule = path.resolve(__dirname, "lib/empty-module.js");
const nativeOnlyModules = new Set([
  "@gorhom/bottom-sheet",
  "@stripe/stripe-react-native",
  "@twotalltotems/react-native-otp-input",
  "react-native-gesture-handler",
  "react-native-google-places-autocomplete",
  "react-native-maps",
  "react-native-maps-directions",
  "react-native-modal",
  "react-native-reanimated",
  "react-native-swiper",
]);

config.resolver.resolverMainFields = ["browser", "react-native", "main"];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && nativeOnlyModules.has(moduleName)) {
    return {
      type: "sourceFile",
      filePath: emptyModule,
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
