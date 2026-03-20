import { Platform } from "react-native";
import Constants from "expo-constants";

const getApiUrl = () => {
  // Check if API_URL is defined in environment
  const envApiUrl =
    process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;

  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback based on platform
  if (Platform.OS === "android") {
    // return "http://10.0.2.2:5000";
  return "https://local-brands-production-0df0.up.railway.app";

  }

  // return "http://192.168.1.6:5000";
  return "https://local-brands-production-0df0.up.railway.app";
};

// --- DEBUG: log every fetch call (URL + payload) ---
const originalFetch = global.fetch;
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const method = init?.method || "GET";
  const body = init?.body;

  console.log(`[API] ${method} ${url}`);
  if (body) {
    try {
      console.log("[API] Payload:", JSON.parse(body as string));
    } catch {
      console.log("[API] Payload:", body);
    }
  }

  return originalFetch(input, init);
};
// --- END DEBUG ---

export default getApiUrl;
