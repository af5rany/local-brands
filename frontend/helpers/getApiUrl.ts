import { Platform } from "react-native";
import Constants from "expo-constants";

const getApiUrl = () => {
  // Check if API_URL is defined in environment
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;

  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback based on platform
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://192.168.1.6:5000";
};

export default getApiUrl;
