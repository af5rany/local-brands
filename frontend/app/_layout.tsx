import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import { CartProvider } from "@/context/CartContext";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/context/ToastContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingWalkthrough from "@/components/OnboardingWalkthrough";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import getApiUrl from "@/helpers/getApiUrl";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

const PROTECTED_SEGMENTS = [
  "checkout",
  "users",
  "manage",
  "orders",
  "referral",
  "cart",
  "profile",
  "returns",
  "wishlist",
  "notifications",
];

async function registerForPushNotifications(token: string) {
  if (!Device.isDevice) return;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
  const platform = Platform.OS;

  try {
    await fetch(`${getApiUrl()}/notifications/push-token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token: expoPushToken, platform }),
    });
  } catch {}
}

function RootLayoutNav() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (
      !loading &&
      !token &&
      segments.length > 0 &&
      PROTECTED_SEGMENTS.includes(segments[0])
    ) {
      router.replace("/auth/login");
    }
  }, [token, segments, loading]);

  // Register push token when user logs in
  useEffect(() => {
    if (token && !loading) {
      registerForPushNotifications(token).catch(() => {});
    }
  }, [token, loading]);

  // Notification listeners
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // notification received in foreground — handled by handler above
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.orderId) router.push(`/orders/${data.orderId}` as any);
      else if (data?.returnId) router.push(`/returns/${data.returnId}` as any);
    });
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      {/* Tabs & Auth — custom layouts */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, title: "Home" }}
      />
      <Stack.Screen
        name="auth/login"
        options={{ headerShown: false, title: "Login" }}
      />
      <Stack.Screen
        name="auth/register"
        options={{ headerShown: false, title: "Register" }}
      />
      <Stack.Screen
        name="auth/forgot-password"
        options={{ headerShown: false, title: "Forgot Password" }}
      />
      <Stack.Screen
        name="auth/reset-password"
        options={{ headerShown: false, title: "Reset Password" }}
      />

      {/* Brands */}
      <Stack.Screen
        name="brands/create"
        options={{ headerShown: false, title: "Create Brand" }}
      />
      <Stack.Screen
        name="brands/select"
        options={{ headerShown: false, title: "Select Brand" }}
      />
      <Stack.Screen
        name="brands/[brandId]/index"
        options={{ headerShown: false, title: "Brand" }}
      />
      <Stack.Screen
        name="brands/[brandId]/posts"
        options={{ headerShown: false, title: "Brand Posts" }}
      />
      <Stack.Screen
        name="brands/[brandId]/edit"
        options={{ headerShown: false, title: "Edit Brand" }}
      />

      {/* Products */}
      <Stack.Screen
        name="products/index"
        options={{
          headerShown: false,
          title: "Browse Products",
          headerBackTitle: "Home",
        }}
      />
      <Stack.Screen
        name="products/create/[brandId]"
        options={{ headerShown: false, title: "Create Product" }}
      />
      <Stack.Screen
        name="products/[productId]"
        options={{ headerShown: false, title: "Product" }}
      />
      <Stack.Screen
        name="products/edit/[productId]"
        options={{ headerShown: false, title: "Edit Product" }}
      />
      {/* Profile */}
      <Stack.Screen
        name="profile/edit"
        options={{ headerShown: false, title: "Edit Profile" }}
      />
      <Stack.Screen
        name="profile/addresses/index"
        options={{ headerShown: false, title: "Addresses" }}
      />
      <Stack.Screen
        name="profile/addresses/new"
        options={{ headerShown: false, title: "New Address" }}
      />
      <Stack.Screen
        name="profile/addresses/[id]"
        options={{ headerShown: false, title: "Edit Address" }}
      />
      <Stack.Screen
        name="profile/settings"
        options={{ headerShown: false, title: "Settings" }}
      />

      {/* Cart & Checkout */}
      <Stack.Screen
        name="cart/index"
        options={{ headerShown: false, title: "Cart" }}
      />
      <Stack.Screen
        name="checkout/index"
        options={{ headerShown: false, title: "Checkout" }}
      />
      <Stack.Screen
        name="checkout/confirmation"
        options={{
          headerShown: false,
          title: "Order Confirmed",
          gestureEnabled: false,
        }}
      />

      {/* Feed */}
      <Stack.Screen
        name="feed/[postId]"
        options={{ headerShown: false, title: "Post" }}
      />
      <Stack.Screen
        name="feed/create"
        options={{ headerShown: false, title: "New Post" }}
      />

      {/* Orders */}
      <Stack.Screen
        name="orders/index"
        options={{ headerShown: false, title: "My Orders" }}
      />
      <Stack.Screen
        name="orders/[orderId]"
        options={{ headerShown: false, title: "Order Details" }}
      />

      <Stack.Screen
        name="referral/index"
        options={{ headerShown: false, title: "Invite Friends" }}
      />
      <Stack.Screen
        name="notifications/index"
        options={{ headerShown: false, title: "Notifications" }}
      />
      <Stack.Screen
        name="notifications/settings"
        options={{ headerShown: false, title: "Notification Settings" }}
      />
      {/* Returns */}
      <Stack.Screen
        name="returns/index"
        options={{ headerShown: false, title: "My Returns" }}
      />
      <Stack.Screen
        name="returns/create"
        options={{ headerShown: false, title: "Request Return" }}
      />
      <Stack.Screen
        name="returns/[returnId]"
        options={{ headerShown: false, title: "Return Details" }}
      />
      {/* Brand — promo codes */}
      <Stack.Screen
        name="brands/[brandId]/promo-codes/index"
        options={{ headerShown: false, title: "Promo Codes" }}
      />
      <Stack.Screen
        name="brands/[brandId]/promo-codes/create"
        options={{ headerShown: false, title: "Create Promo Code" }}
      />
      <Stack.Screen
        name="brands/[brandId]/promo-codes/[promoId]"
        options={{ headerShown: false, title: "Promo Code" }}
      />
      {/* Brand — shipping */}
      <Stack.Screen
        name="brands/[brandId]/shipping/index"
        options={{ headerShown: false, title: "Shipping Zones" }}
      />
      <Stack.Screen
        name="brands/[brandId]/shipping/zone"
        options={{ headerShown: false, title: "Shipping Zone" }}
      />
      {/* Brand — returns */}
      <Stack.Screen
        name="brands/[brandId]/returns/index"
        options={{ headerShown: false, title: "Returns" }}
      />
      <Stack.Screen
        name="brands/[brandId]/returns/[returnId]"
        options={{ headerShown: false, title: "Return Request" }}
      />
      <Stack.Screen
        name="brands/[brandId]/return-policy"
        options={{ headerShown: false, title: "Return Policy" }}
      />

      <Stack.Screen
        name="users/index"
        options={{ headerShown: false, title: "Users" }}
      />
      <Stack.Screen
        name="manage/index"
        options={{
          headerShown: false,
          title: "Management",
        }}
      />

      {/* Info */}
      <Stack.Screen
        name="info/shipping"
        options={{ headerShown: false, title: "Shipping" }}
      />
      <Stack.Screen
        name="info/returns"
        options={{ headerShown: false, title: "Returns & Refunds" }}
      />
      <Stack.Screen
        name="info/about"
        options={{ headerShown: false, title: "About Us" }}
      />
      <Stack.Screen
        name="info/contact"
        options={{ headerShown: false, title: "Contact Us" }}
      />
    </Stack>
  );
}

const ONBOARDING_KEY = "@monolith_onboarding_complete";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingDone(value === "true");
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded && onboardingDone !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, onboardingDone]);

  if (!fontsLoaded || onboardingDone === null) {
    return null;
  }

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setOnboardingDone(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GlobalErrorBoundary>
          <ThemeProvider>
            <NetworkProvider>
              <ToastProvider>
                <AuthProvider>
                  <BrandProvider>
                    <CartProvider>
                      {onboardingDone ? (
                        <RootLayoutNav />
                      ) : (
                        <OnboardingWalkthrough onComplete={handleOnboardingComplete} />
                      )}
                    </CartProvider>
                  </BrandProvider>
                </AuthProvider>
              </ToastProvider>
            </NetworkProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
