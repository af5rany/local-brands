import { useState } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import getApiUrl from "@/helpers/getApiUrl";

WebBrowser.maybeCompleteAuthSession();

const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

const facebookDiscovery = {
  authorizationEndpoint: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
};

// iOS dev build uses the reverse client ID scheme (registered in app.json CFBundleURLTypes)
// Android/Web falls back to the web client approach
const googleClientId =
  Platform.OS === "ios"
    ? (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string)
    : (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string);

const redirectUri = AuthSession.makeRedirectUri(
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
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    googleDiscovery,
  );

  const [fbRequest, , fbPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID as string,
      redirectUri,
      scopes: ["public_profile", "email"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    facebookDiscovery,
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
    try {
      const result = await googlePromptAsync();
      if (result.type === "success") {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: googleClientId,
            redirectUri,
            code: result.params.code,
            extraParams: googleRequest?.codeVerifier
              ? { code_verifier: googleRequest.codeVerifier }
              : undefined,
          },
          googleDiscovery,
        );
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
    try {
      const result = await fbPromptAsync();
      if (result.type === "success") {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID as string,
            redirectUri,
            code: result.params.code,
            extraParams: fbRequest?.codeVerifier
              ? { code_verifier: fbRequest.codeVerifier }
              : undefined,
          },
          facebookDiscovery,
        );
        const jwt = await sendToBackend("facebook", tokenResponse.accessToken);
        onSuccess(jwt);
      }
    } catch (err: any) {
      Alert.alert(
        "Facebook Sign-In Error",
        err.message || "Something went wrong",
      );
    } finally {
      setFacebookLoading(false);
    }
  };

  return { handleGoogle, handleFacebook, googleLoading, facebookLoading };
}
