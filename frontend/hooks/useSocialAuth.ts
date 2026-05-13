import { useState } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import getApiUrl from "@/helpers/getApiUrl";

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

const googleClientId =
  Platform.OS === "ios"
    ? (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string)
    : (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string);

// Google: uses iOS reverse-scheme redirect on iOS, default on Android/Web
const googleRedirectUri = AuthSession.makeRedirectUri(
  Platform.OS === "ios"
    ? { native: `${process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSE_SCHEME}:/` }
    : {},
);

export function useSocialAuth(onSuccess: (token: string) => void) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  const [googleRequest, , googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri: googleRedirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    googleDiscovery,
  );

  const sendToBackend = async (
    provider: "google" | "facebook",
    token: string,
  ) => {
    const res = await fetch(`${getApiUrl()}/auth/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, token }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Social login failed");
    }
    const data = await res.json();
    return data.token as string;
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    console.log("[GoogleAuth] REDIRECT URI:", googleRedirectUri);
    console.log("[GoogleAuth] AUTH CLIENT ID:", googleClientId);
    console.log("[GoogleAuth] CODE VERIFIER EXISTS:", !!googleRequest?.codeVerifier);
    try {
      const result = await googlePromptAsync();
      if (result.type === "success") {
        let tokenResponse;
        try {
          tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId: googleClientId,
              redirectUri: googleRedirectUri,
              code: result.params.code,
              extraParams: googleRequest?.codeVerifier
                ? { code_verifier: googleRequest.codeVerifier }
                : undefined,
            },
            googleDiscovery,
          );
        } catch (exchangeError) {
          console.log("[GoogleAuth] EXCHANGE ERROR JSON:", JSON.stringify(exchangeError, null, 2));
          throw exchangeError;
        }
        const jwt = await sendToBackend("google", tokenResponse.accessToken);
        onSuccess(jwt);
      }
    } catch (err: any) {
      Alert.alert("Google Sign-In Error", err.message || "Something went wrong");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    setFacebookLoading(true);
    console.log("[FacebookAuth] APP_ID:", process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);
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
      console.log("[FacebookAuth] HAS ACCESS TOKEN:", !!data.accessToken);
      console.log("[FacebookAuth] USER ID:", data.userID);
      const jwt = await sendToBackend("facebook", data.accessToken);
      onSuccess(jwt);
    } catch (err: any) {
      Alert.alert("Facebook Sign-In Error", err.message || "Something went wrong");
    } finally {
      setFacebookLoading(false);
    }
  };

  return { handleGoogle, handleFacebook, googleLoading, facebookLoading };
}
