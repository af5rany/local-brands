import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/context/ToastContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { useEffect } from "react";

// Orders, wishlist, and profile are now tabs — they handle guest state internally.
// Only standalone stack routes that hard-require auth are listed here.
const PROTECTED_SEGMENTS = ['cart', 'checkout', 'users', 'manage'];

// This component will handle the conditional routing
function RootLayoutNav() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loading && !token && segments.length > 0 && PROTECTED_SEGMENTS.includes(segments[0])) {
      router.replace('/auth/login');
    }
  }, [token, segments, loading]);

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
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, title: "Login" }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false, title: "Register" }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, title: "Forgot Password" }} />
      <Stack.Screen name="auth/reset-password" options={{ headerShown: false, title: "Reset Password" }} />

      {/* Brands */}
      <Stack.Screen name="brands/index" options={{ title: "Browse Brands", headerBackTitle: "Home" }} />
      <Stack.Screen name="brands/create" options={{ headerShown: false, title: "Create Brand" }} />
      <Stack.Screen name="brands/select" options={{ headerShown: false, title: "Select Brand" }} />
      <Stack.Screen name="brands/[brandId]/index" options={{ headerShown: false, title: "Brand" }} />
      <Stack.Screen name="brands/[brandId]/edit" options={{ headerShown: false, title: "Edit Brand" }} />
      <Stack.Screen name="brands/[brandId]/products" options={{ title: "Brand Products", headerBackTitle: "Brand" }} />

      {/* Products */}
      <Stack.Screen name="products/index" options={{ title: "Browse Products", headerBackTitle: "Home" }} />
      <Stack.Screen name="products/create/[brandId]" options={{ title: "Create Product", headerBackTitle: "Brand" }} />
      <Stack.Screen name="products/[productId]" options={{ headerShown: false, title: "Product" }} />
      <Stack.Screen name="products/edit/[productId]" options={{ title: "Edit Product", headerBackTitle: "Product" }} />
      <Stack.Screen name="products/draft_[productId]" options={{ headerShown: false, title: "Draft" }} />

      {/* Profile */}
      <Stack.Screen name="profile/index" options={{ title: "My Profile", headerBackTitle: "Home" }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false, title: "Edit Profile" }} />
      <Stack.Screen name="profile/addresses/index" options={{ headerShown: false, title: "Addresses" }} />
      <Stack.Screen name="profile/addresses/new" options={{ headerShown: false, title: "New Address" }} />
      <Stack.Screen name="profile/addresses/[id]" options={{ headerShown: false, title: "Edit Address" }} />
      <Stack.Screen name="profile/settings" options={{ headerShown: false, title: "Settings" }} />

      {/* Cart & Checkout */}
      <Stack.Screen name="cart/index" options={{ headerShown: false, title: "Cart" }} />
      <Stack.Screen name="checkout/index" options={{ headerShown: false, title: "Checkout" }} />

      {/* Orders */}
      <Stack.Screen name="orders/index" options={{ title: "My Orders", headerBackTitle: "Home" }} />
      <Stack.Screen name="orders/[orderId]" options={{ headerShown: false, title: "Order Details" }} />

      <Stack.Screen name="wishlist/index" options={{ title: "Wishlist", headerBackTitle: "Home" }} />
      <Stack.Screen name="users/index" options={{ headerShown: false, title: "Users" }} />
      <Stack.Screen name="manage/index" options={{ headerShown: false, title: "Management", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <BrandProvider>
              <RootLayoutNav />
            </BrandProvider>
          </AuthProvider>
        </ToastProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
