import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import { CartProvider } from "@/context/CartContext";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/context/ToastContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { useEffect } from "react";

// Tabs (home, shop, wishlist, brands, profile) handle their own auth state internally.
// Only standalone stack routes that hard-require auth are listed here.
const PROTECTED_SEGMENTS = ['checkout', 'users', 'manage', 'orders', 'referral'];

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
        name="brands/index"
        options={{ headerShown: false, title: "Brands" }}
      />
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
        name="brands/[brandId]/edit"
        options={{ headerShown: false, title: "Edit Brand" }}
      />
      <Stack.Screen
        name="brands/[brandId]/products"
        options={{ title: "Brand Products", headerBackTitle: "Brand" }}
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
        options={{ title: "Create Product", headerBackTitle: "Brand" }}
      />
      <Stack.Screen
        name="products/[productId]"
        options={{ headerShown: false, title: "Product" }}
      />
      <Stack.Screen
        name="products/edit/[productId]"
        options={{ title: "Edit Product", headerBackTitle: "Product" }}
      />
      <Stack.Screen
        name="products/draft_[productId]"
        options={{ headerShown: false, title: "Draft" }}
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
        name="users/index"
        options={{ headerShown: false, title: "Users" }}
      />
      <Stack.Screen
        name="manage/index"
        options={{
          headerShown: false,
          title: "Management",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <NetworkProvider>
            <ToastProvider>
              <AuthProvider>
                <BrandProvider>
                  <CartProvider>
                    <RootLayoutNav />
                  </CartProvider>
                </BrandProvider>
              </AuthProvider>
            </ToastProvider>
          </NetworkProvider>
        </ThemeProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
