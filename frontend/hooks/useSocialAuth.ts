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

// Facebook: uses Expo auth proxy (HTTPS) — required because Facebook
// strict mode + Enforce HTTPS rejects custom native schemes
const facebookRedirectUri = "https://auth.expo.io/@fakharanii/local-brands";


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

  const [fbRequest, , fbPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID as string,
      redirectUri: facebookRedirectUri,
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
    console.log("[FacebookAuth] REDIRECT URI:", facebookRedirectUri);
    console.log("[FacebookAuth] CODE VERIFIER EXISTS:", !!fbRequest?.codeVerifier);
    try {
      const result = await fbPromptAsync();
      console.log("[FacebookAuth] PROMPT RESULT:", JSON.stringify(result, null, 2));
      if (result.type === "success") {
        let tokenResponse;
        try {
          tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID as string,
              redirectUri: facebookRedirectUri,
              code: result.params.code,
              extraParams: fbRequest?.codeVerifier
                ? { code_verifier: fbRequest.codeVerifier }
                : undefined,
            },
            facebookDiscovery,
          );
        } catch (exchangeError) {
          console.log("[FacebookAuth] EXCHANGE ERROR JSON:", JSON.stringify(exchangeError, null, 2));
          throw exchangeError;
        }
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