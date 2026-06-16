import { LogBox } from "react-native";

export const ignoreClerkLogs = () => {
  LogBox.ignoreLogs(["Clerk:"]);
};
