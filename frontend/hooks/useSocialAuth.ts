import { useState } from "react";
import { Alert, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import getApiUrl from "@/helpers/getApiUrl";

const DEV_BUILD_ALERT = "Social sign-in requires a development build. Run: npx expo run:ios";

function loadGoogleSignin() {
  try {
    return require("@react-native-google-signin/google-signin");
  } catch {
    return null;
  }
}

function loadFacebookSDK() {
  try {
    return require("react-native-fbsdk-next");
  } catch {
    return null;
  }
}

type SocialPayload =
  | { token: string }
  | {
      identityToken: string;
      authorizationCode: string | null;
      user: string;
      fullName: AppleAuthentication.AppleAuthenticationFullName | null;
      email: string | null;
    };

export function useSocialAuth(onSuccess: (token: string) => void) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const sendToBackend = async (
    provider: "google" | "facebook" | "apple",
    payload: SocialPayload,
  ) => {
    const res = await fetch(`${getApiUrl()}/auth/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, ...payload }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Social login failed");
    }
    const data = await res.json();
    return data.token as string;
  };

  const handleGoogle = async () => {
    const googleSDK = loadGoogleSignin();
    if (!googleSDK) {
      Alert.alert("Not Available", DEV_BUILD_ALERT);
      return;
    }
    const { GoogleSignin, statusCodes } = googleSDK;

    setGoogleLoading(true);
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ["profile", "email"],
        offlineAccess: false,
      });

      if (Platform.OS === "android") {
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        } catch {
          Alert.alert("Google Sign-In Error", "Google Play Services is required");
          return;
        }
      }

      const userInfo = await GoogleSignin.signIn();
      console.log("[GoogleAuth] USER INFO:", JSON.stringify(userInfo, null, 2));

      const tokens = await GoogleSignin.getTokens();
      console.log("[GoogleAuth] HAS ACCESS TOKEN:", !!tokens.accessToken);

      const jwt = await sendToBackend("google", { token: tokens.accessToken });
      onSuccess(jwt);
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      } else if (err.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Google Sign-In", "Sign-in already in progress");
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Google Sign-In Error", "Google Play Services not available");
      } else {
        Alert.alert("Google Sign-In Error", err.message || "Something went wrong");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    const fbSDK = loadFacebookSDK();
    if (!fbSDK) {
      Alert.alert("Not Available", DEV_BUILD_ALERT);
      return;
    }
    const { LoginManager, AccessToken } = fbSDK;

    setFacebookLoading(true);
    try {
      const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
      console.log("[FacebookAuth] LOGIN RESULT:", JSON.stringify(result, null, 2));
      if (result.isCancelled) {
        return;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data || !data.accessToken) {
        throw new Error("Failed to get Facebook access token");
      }
      const jwt = await sendToBackend("facebook", { token: data.accessToken });
      onSuccess(jwt);
    } catch (err: any) {
      Alert.alert("Facebook Sign-In Error", err.message || "Something went wrong");
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleApple = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Apple Sign-In is only available on iOS");
      return;
    }

    setAppleLoading(true);
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        Alert.alert("Apple Sign-In Error", "Apple Sign-In is not available on this device");
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple Sign-In did not return an identity token");
      }

      const jwt = await sendToBackend("apple", {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        user: credential.user,
        fullName: credential.fullName,
        email: credential.email,
      });

      onSuccess(jwt);
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      Alert.alert("Apple Sign-In Error", err.message || "Something went wrong");
    } finally {
      setAppleLoading(false);
    }
  };

  return { handleGoogle, handleFacebook, handleApple, googleLoading, facebookLoading, appleLoading };
}
